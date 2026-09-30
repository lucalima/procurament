-- Backend Schema §10 #26 / §4.3: custom_access_token hook. Injects user_type,
-- role and org_id into JWT app_metadata; every RLS policy depends on it.
--
-- Registration: locally via [auth.hook.custom_access_token] in
-- supabase/config.toml; in production via Dashboard → Auth → Hooks (Phase 12).

-- NOTE: SET search_path is not in §4.3. The auth service's role does not have
-- public on its search_path, so the unqualified %ROWTYPE declarations below
-- would not resolve without it.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  claims jsonb;
  v_profile profiles%ROWTYPE;
  v_vendor  vendor_accounts%ROWTYPE;
BEGIN
  claims := event->'claims';

  -- Try internal user first
  SELECT * INTO v_profile FROM public.profiles
    WHERE id = (event->>'user_id')::uuid AND is_active = true;

  IF FOUND THEN
    claims := jsonb_set(claims, '{app_metadata}', jsonb_build_object(
      'user_type', 'internal',
      'role',      v_profile.role,
      'org_id',    v_profile.org_id
    ));
  ELSE
    -- Try vendor user
    SELECT * INTO v_vendor FROM public.vendor_accounts
      WHERE auth_user_id = (event->>'user_id')::uuid AND is_active = true;

    IF FOUND THEN
      claims := jsonb_set(claims, '{app_metadata}', jsonb_build_object(
        'user_type', 'vendor',
        'role',      'vendor',
        'org_id',    v_vendor.org_id
      ));
    END IF;
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- NOTE: not in §4.3. Supabase runs hooks as the supabase_auth_admin role, which
-- needs execute rights on the hook and read access to the tables it queries
-- (both have RLS). Clients must not be able to call the hook directly.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

GRANT SELECT ON TABLE public.profiles, public.vendor_accounts TO supabase_auth_admin;

CREATE POLICY "auth_admin_read_profiles" ON public.profiles
  AS PERMISSIVE FOR SELECT TO supabase_auth_admin USING (true);

CREATE POLICY "auth_admin_read_vendor_accounts" ON public.vendor_accounts
  AS PERMISSIVE FOR SELECT TO supabase_auth_admin USING (true);
