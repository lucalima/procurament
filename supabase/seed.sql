-- Local development seed data (Implementation Plan Phase 2). Applied by
-- `npx supabase db reset` after all migrations. Never run against production.
--
-- Test accounts (password for all: Password123!)
--   pm@procuremaster.test       Procurement Manager (creates the org)
--   dh@procuremaster.test       Department Head
--   fa@procuremaster.test       Finance Approver
--   vendor1@procuremaster.test  Vendor — Brightline Cloud Services
--   vendor2@procuremaster.test  Vendor — Stratus Data Systems

DO $$
DECLARE
  v_pm_id      uuid := '10000000-0000-4000-8000-000000000001';
  v_dh_id      uuid := '10000000-0000-4000-8000-000000000002';
  v_fa_id      uuid := '10000000-0000-4000-8000-000000000003';
  v_v1_user_id uuid := '10000000-0000-4000-8000-000000000011';
  v_v2_user_id uuid := '10000000-0000-4000-8000-000000000012';
  v_v1_id      uuid := '20000000-0000-4000-8000-000000000011';
  v_v2_id      uuid := '20000000-0000-4000-8000-000000000012';
  v_req_id     uuid := '30000000-0000-4000-8000-000000000001';
  v_rfp_id     uuid := '40000000-0000-4000-8000-000000000001';
  v_org_id     uuid;
  v_password   text := extensions.crypt('Password123!', extensions.gen_salt('bf'));
  u            record;
BEGIN
  -- Auth users. The PM is inserted first: handle_new_user() creates the org
  -- and the PM profile from the metadata. DH and FA then join that org.
  -- Vendors carry no role, so handle_new_user() creates no profile for them.
  FOR u IN
    SELECT * FROM (VALUES
      (v_pm_id,      'pm@procuremaster.test',      jsonb_build_object('role', 'procurement_manager', 'full_name', 'Priya Mensah', 'org_name', 'Northwind Trading', 'currency', 'USD')),
      (v_v1_user_id, 'vendor1@procuremaster.test', jsonb_build_object('full_name', 'Omar Haddad')),
      (v_v2_user_id, 'vendor2@procuremaster.test', jsonb_build_object('full_name', 'Mei Tanaka'))
    ) AS t(id, email, meta)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, v_password, now(),
      '{"provider":"email","providers":["email"]}', u.meta, now(), now(),
      '', '', '', '', '', '', '', ''
    );
  END LOOP;

  SELECT org_id INTO v_org_id FROM public.profiles WHERE id = v_pm_id;

  FOR u IN
    SELECT * FROM (VALUES
      (v_dh_id, 'dh@procuremaster.test', jsonb_build_object('role', 'department_head',  'full_name', 'Daniel Okafor', 'org_id', v_org_id)),
      (v_fa_id, 'fa@procuremaster.test', jsonb_build_object('role', 'finance_approver', 'full_name', 'Fatima Rossi',  'org_id', v_org_id))
    ) AS t(id, email, meta)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, v_password, now(),
      '{"provider":"email","providers":["email"]}', u.meta, now(), now(),
      '', '', '', '', '', '', '', ''
    );
  END LOOP;

  -- Email identities so the users can sign in with email + password
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), au.id, au.id::text,
         jsonb_build_object('sub', au.id::text, 'email', au.email, 'email_verified', true),
         'email', now(), now(), now()
  FROM auth.users au
  WHERE au.id IN (v_pm_id, v_dh_id, v_fa_id, v_v1_user_id, v_v2_user_id);

  -- The seeded org is already set up, so the PM skips the onboarding wizard.
  -- Sign up a new PM to exercise onboarding.
  UPDATE public.profiles SET onboarding_complete = true WHERE org_id = v_org_id;

  -- Sample requirement raised by the Department Head
  INSERT INTO public.requirements (id, org_id, raised_by, title, description, department, budget_estimate, required_by, priority, status)
  VALUES (
    v_req_id, v_org_id, v_dh_id,
    'Cloud backup and disaster recovery',
    'Replace the on-premise tape backups with a managed cloud backup service covering 40 TB of file and database data, with a recovery time under 4 hours.',
    'IT', 60000, CURRENT_DATE + 90, 'high', 'in_progress'
  );

  -- Sample RFP created from that requirement (rfp_evaluation_created adds its evaluation)
  INSERT INTO public.rfps (id, org_id, created_by, requirement_id, title, description, department, budget_min, budget_max, submission_deadline, status)
  VALUES (
    v_rfp_id, v_org_id, v_pm_id, v_req_id,
    'Cloud Backup and DR Services',
    'Seeking a managed cloud backup and disaster recovery provider for 40 TB of data, with a recovery time objective under 4 hours and 7-year retention.',
    'IT', 40000, 60000, now() + INTERVAL '14 days', 'vendors_invited'
  );

  UPDATE public.requirements SET linked_rfp_id = v_rfp_id WHERE id = v_req_id;

  -- Two vendors who have accepted their invites to the RFP
  INSERT INTO public.vendor_accounts (id, org_id, auth_user_id, company_name, contact_name, email, is_active) VALUES
    (v_v1_id, v_org_id, v_v1_user_id, 'Brightline Cloud Services', 'Omar Haddad', 'vendor1@procuremaster.test', true),
    (v_v2_id, v_org_id, v_v2_user_id, 'Stratus Data Systems',      'Mei Tanaka',  'vendor2@procuremaster.test', true);

  INSERT INTO public.vendor_invites (org_id, rfp_id, vendor_account_id, invited_by, token, status, expires_at, accepted_at) VALUES
    (v_org_id, v_rfp_id, v_v1_id, v_pm_id, encode(extensions.gen_random_bytes(32), 'hex'), 'accepted', now() + INTERVAL '72 hours', now()),
    (v_org_id, v_rfp_id, v_v2_id, v_pm_id, encode(extensions.gen_random_bytes(32), 'hex'), 'accepted', now() + INTERVAL '72 hours', now());

  INSERT INTO public.rfp_vendor_entries (org_id, rfp_id, vendor_account_id, status) VALUES
    (v_org_id, v_rfp_id, v_v1_id, 'invited'),
    (v_org_id, v_rfp_id, v_v2_id, 'invited');
END $$;
