-- Backend Schema §10 #22: database functions (§6). The RLS helper functions
-- (§4.4) live in 0021 and the auth hook (§4.3) in 0026.

-- 6.1 updated_at auto-timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6.2 Create org + profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id   uuid;
  v_role     public.user_role;
  v_org_name text;
BEGIN
  -- Read metadata passed from the signup call
  v_role     := (NEW.raw_user_meta_data->>'role')::public.user_role;
  v_org_name := NEW.raw_user_meta_data->>'org_name';
  v_org_id   := (NEW.raw_user_meta_data->>'org_id')::uuid;

  -- NOTE: not in §6.2. Vendor users sign up without an internal role and have
  -- no profile (they live in vendor_accounts); without this guard the NOT NULL
  -- profiles.role would abort every vendor signup.
  IF v_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- If PM with no org_id: create new org
  IF v_role = 'procurement_manager' AND v_org_id IS NULL THEN
    INSERT INTO public.organisations (name, slug, currency)
    VALUES (
      v_org_name,
      lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]', '-', 'g')),
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
    )
    RETURNING id INTO v_org_id;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, org_id, full_name, role)
  VALUES (
    NEW.id,
    v_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role
  );

  RETURN NEW;
END;
$$;

-- 6.3 Auto-create evaluation on RFP creation
CREATE OR REPLACE FUNCTION public.create_evaluation_for_rfp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.evaluations (org_id, rfp_id)
  VALUES (NEW.org_id, NEW.id);
  RETURN NEW;
END;
$$;

-- 6.4 Auto-create contract on approval
-- NOTE: SECURITY DEFINER is not in §6.4. The Finance Approver's update fires
-- this trigger, and RLS gives the FA no INSERT on contracts or UPDATE on
-- rfp_vendor_entries, so without it every approval would fail.
CREATE OR REPLACE FUNCTION public.create_contract_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rfp rfps%ROWTYPE;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    SELECT * INTO v_rfp FROM public.rfps WHERE id = NEW.rfp_id;

    INSERT INTO public.contracts (
      org_id, rfp_id, vendor_account_id, approval_request_id,
      title, start_date, end_date, currency
    ) VALUES (
      NEW.org_id,
      NEW.rfp_id,
      NEW.vendor_account_id,
      NEW.id,
      v_rfp.title || ' — Contract',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',  -- Default 1 year; PM updates after creation
      COALESCE((
        SELECT currency FROM public.organisations WHERE id = NEW.org_id
      ), 'USD')
    );

    -- Update vendor status to contracted
    UPDATE public.rfp_vendor_entries
    SET status = 'contracted'
    WHERE rfp_id = NEW.rfp_id AND vendor_account_id = NEW.vendor_account_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 6.5 Validate criteria weights sum to at most 100
CREATE OR REPLACE FUNCTION public.validate_criteria_weights()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(weight), 0) INTO v_total
  FROM public.evaluation_criteria
  WHERE evaluation_id = NEW.evaluation_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  v_total := v_total + NEW.weight;

  -- Only enforce when evaluation is being confirmed (criteria_pending → scored)
  -- During setup we allow partial weights
  IF v_total > 100.01 THEN
    -- NOTE: §6.5 ends the message with '%%' (a literal percent sign), which
    -- leaves v_total without a placeholder and makes RAISE itself error.
    RAISE EXCEPTION 'Criteria weights cannot exceed 100%%. Current total: %', v_total;
  END IF;

  RETURN NEW;
END;
$$;

-- 6.6 Contract expiry status updater (called daily by the Vercel Cron job)
CREATE OR REPLACE FUNCTION public.process_contract_renewals()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r contracts%ROWTYPE;
  v_pm_id uuid;
  v_days_remaining int;
BEGIN
  FOR r IN
    SELECT * FROM public.contracts
    WHERE status IN ('active', 'expiring_soon')
    AND is_deleted = false
  LOOP
    v_days_remaining := (r.end_date - CURRENT_DATE);

    -- Update to expiring_soon
    IF v_days_remaining <= r.alert_days AND r.status = 'active' THEN
      UPDATE public.contracts SET status = 'expiring_soon' WHERE id = r.id;

      -- Get PM for this org
      SELECT id INTO v_pm_id FROM public.profiles
      WHERE org_id = r.org_id AND role = 'procurement_manager' AND is_active = true LIMIT 1;

      -- Create notification
      -- NOTE: guard not in §6.6; notifications.recipient_id is NOT NULL, so an
      -- org without an active PM would otherwise abort the whole daily run.
      IF v_pm_id IS NOT NULL THEN
        INSERT INTO public.notifications
          (org_id, recipient_id, type, title, body, entity_type, entity_id)
        VALUES (
          r.org_id, v_pm_id, 'renewal_alert',
          'Contract expiring in ' || v_days_remaining || ' days',
          r.title || ' expires on ' || r.end_date::text,
          'contract', r.id
        );
      END IF;
    END IF;

    -- Update to expired
    IF v_days_remaining <= 0 AND r.status != 'expired' THEN
      UPDATE public.contracts SET status = 'expired' WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;
