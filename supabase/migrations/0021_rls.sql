-- Backend Schema §10 #21: RLS ENABLE + policies for all tables (§5).

-- ---------------------------------------------------------------------------
-- Helper functions for RLS (§4.4)
-- NOTE: §10 lists these under 0022, but PostgreSQL rejects a policy that calls
-- a function that does not exist yet, so they are created here, before the
-- policies that use them.
-- ---------------------------------------------------------------------------

-- Returns the org_id from the JWT
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt()->'app_metadata'->>'org_id')::uuid;
$$;

-- Returns the user role from the JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt()->'app_metadata'->>'role';
$$;

-- Returns the user type from the JWT
CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt()->'app_metadata'->>'user_type';
$$;

-- Returns true if the current user is a PM
CREATE OR REPLACE FUNCTION public.is_pm()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_role() = 'procurement_manager';
$$;

-- Returns true if the current user is an internal user
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_type() = 'internal';
$$;

-- Returns true if the current user is a vendor
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_type() = 'vendor';
$$;

-- ---------------------------------------------------------------------------
-- 5.1 organisations
-- ---------------------------------------------------------------------------
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- Internal users can read their own org
CREATE POLICY "org_read" ON public.organisations
  FOR SELECT USING (id = public.get_org_id() AND public.is_internal());

-- Only PM can update org
CREATE POLICY "org_update" ON public.organisations
  FOR UPDATE USING (id = public.get_org_id() AND public.is_pm());

-- ---------------------------------------------------------------------------
-- 5.2 profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any internal user can read profiles in their org
CREATE POLICY "profiles_read" ON public.profiles
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- Users can update their own profile
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- PM can insert new profiles (team invites)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_pm());

-- ---------------------------------------------------------------------------
-- 5.3 vendor_accounts
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;

-- Internal users can read vendor accounts in their org
CREATE POLICY "vendor_accounts_internal_read" ON public.vendor_accounts
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- Vendor can read only their own record
CREATE POLICY "vendor_accounts_self_read" ON public.vendor_accounts
  FOR SELECT USING (auth_user_id = auth.uid() AND public.is_vendor());

-- PM can insert and update vendor accounts
CREATE POLICY "vendor_accounts_pm_write" ON public.vendor_accounts
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- ---------------------------------------------------------------------------
-- vendor_invites (NOTE: no policy in §5; added in the §5 style, user-approved 2026-09-30)
-- Invite-token validation for the public acceptance page runs server-side.
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_invites ENABLE ROW LEVEL SECURITY;

-- Only PM can create and manage invites
CREATE POLICY "vendor_invites_pm" ON public.vendor_invites
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- ---------------------------------------------------------------------------
-- requirements (NOTE: no policy in §5; added in the §5 style, user-approved 2026-09-30)
-- App Flow §5: DH owns their requirements; PM reads all and actions them.
-- ---------------------------------------------------------------------------
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- PM can read all requirements in their org
CREATE POLICY "requirements_pm_read" ON public.requirements
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_pm() AND is_deleted = false);

-- PM can update requirements (status, linked RFP)
CREATE POLICY "requirements_pm_update" ON public.requirements
  FOR UPDATE USING (org_id = public.get_org_id() AND public.is_pm());

-- DH can read only the requirements they raised
CREATE POLICY "requirements_dh_read" ON public.requirements
  FOR SELECT USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'department_head' AND
    raised_by = auth.uid() AND
    is_deleted = false
  );

-- DH can raise requirements
CREATE POLICY "requirements_dh_insert" ON public.requirements
  FOR INSERT WITH CHECK (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'department_head' AND
    raised_by = auth.uid()
  );

-- DH can edit their own requirement only while draft or submitted (App Flow §5),
-- and cannot move it past submitted (the PM actions it from there)
CREATE POLICY "requirements_dh_update" ON public.requirements
  FOR UPDATE USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'department_head' AND
    raised_by = auth.uid() AND
    status IN ('draft', 'submitted')
  )
  WITH CHECK (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'department_head' AND
    raised_by = auth.uid() AND
    status IN ('draft', 'submitted')
  );

-- ---------------------------------------------------------------------------
-- 5.4 rfps
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;

-- All internal users can read RFPs in their org
CREATE POLICY "rfps_internal_read" ON public.rfps
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal() AND is_deleted = false);

-- Only PM can create, update, or soft-delete RFPs
CREATE POLICY "rfps_pm_write" ON public.rfps
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- Vendors cannot access rfps table directly

-- ---------------------------------------------------------------------------
-- rfp_vendor_entries (NOTE: no policy in §5; added in the §5 style, user-approved 2026-09-30)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfp_vendor_entries ENABLE ROW LEVEL SECURITY;

-- Internal users read all entries in their org
CREATE POLICY "rfp_vendor_entries_internal_read" ON public.rfp_vendor_entries
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- Only PM can create and update entries (invite, shortlist, status changes)
CREATE POLICY "rfp_vendor_entries_pm_write" ON public.rfp_vendor_entries
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- Vendor reads only their own entries (vendor home "My RFPs" and status)
CREATE POLICY "rfp_vendor_entries_vendor_read" ON public.rfp_vendor_entries
  FOR SELECT USING (
    public.is_vendor() AND
    vendor_account_id IN (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5.5 submissions and documents
-- NOTE: §5 matches the vendor with "vendor_account_id = (SELECT id ...)". One
-- vendor login can own several vendor_accounts rows (one per inviting org), and
-- a scalar subquery errors when it returns more than one row, so these use IN.
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Internal users read all submissions in their org
CREATE POLICY "submissions_internal_read" ON public.submissions
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- Vendor reads only their own submission
CREATE POLICY "submissions_vendor_read" ON public.submissions
  FOR SELECT USING (
    public.is_vendor() AND
    vendor_account_id IN (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Vendor can update only their own in_progress submission
-- NOTE: WITH CHECK is not in §5.5; without it the final submit (in_progress →
-- submitted) fails, because USING would also be applied to the new row.
CREATE POLICY "submissions_vendor_update" ON public.submissions
  FOR UPDATE USING (
    public.is_vendor() AND status = 'in_progress' AND
    vendor_account_id IN (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_vendor() AND
    vendor_account_id IN (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Same pattern for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_internal_read" ON public.documents
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "documents_vendor_own" ON public.documents
  FOR ALL USING (
    public.is_vendor() AND
    submission_id IN (
      SELECT id FROM public.submissions WHERE
        vendor_account_id IN (SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 5.6 evaluations and scores
-- ---------------------------------------------------------------------------
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_scores ENABLE ROW LEVEL SECURITY;

-- All internal users can read evaluations in their org
CREATE POLICY "evaluations_read" ON public.evaluations
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- Only PM can write evaluations
CREATE POLICY "evaluations_pm_write" ON public.evaluations
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- Same read pattern for criteria and scores
CREATE POLICY "criteria_read" ON public.evaluation_criteria
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "criteria_pm_write" ON public.evaluation_criteria
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

CREATE POLICY "scores_read" ON public.vendor_scores
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "scores_pm_write" ON public.vendor_scores
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- Vendors never see scores

-- ---------------------------------------------------------------------------
-- 5.7 approval_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- PM and Finance Approver can read approvals in their org
CREATE POLICY "approvals_read" ON public.approval_requests
  FOR SELECT USING (
    org_id = public.get_org_id() AND
    public.get_user_role() IN ('procurement_manager','finance_approver')
  );

-- PM can insert (submit for approval)
CREATE POLICY "approvals_pm_insert" ON public.approval_requests
  FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_pm());

-- NOTE: the WITH CHECK clauses on the two UPDATE policies below are not in §5.7.
-- Without them PostgreSQL applies USING (status = 'pending') to the updated row
-- too, so recalling or deciding (which changes status) would always be rejected.

-- PM can update (recall)
CREATE POLICY "approvals_pm_recall" ON public.approval_requests
  FOR UPDATE USING (org_id = public.get_org_id() AND public.is_pm() AND status = 'pending')
  WITH CHECK (org_id = public.get_org_id() AND public.is_pm());

-- Finance Approver can update (decide)
CREATE POLICY "approvals_fa_decide" ON public.approval_requests
  FOR UPDATE USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'finance_approver' AND
    status = 'pending'
  )
  WITH CHECK (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'finance_approver'
  );

-- ---------------------------------------------------------------------------
-- 5.8 contracts
-- ---------------------------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- PM can read and manage all contracts
CREATE POLICY "contracts_pm" ON public.contracts
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm() AND is_deleted = false);

-- Finance Approver can read contracts (for approval context)
CREATE POLICY "contracts_fa_read" ON public.contracts
  FOR SELECT USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'finance_approver' AND
    is_deleted = false
  );

-- ---------------------------------------------------------------------------
-- scoring_templates (NOTE: no policy in §5; added in the §5 style, user-approved 2026-09-30)
-- ---------------------------------------------------------------------------
ALTER TABLE public.scoring_templates ENABLE ROW LEVEL SECURITY;

-- Org-level templates: any PM in the org can use and manage them
CREATE POLICY "scoring_templates_pm" ON public.scoring_templates
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- ---------------------------------------------------------------------------
-- 5.9 compliance_flags, activity_log, notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_internal_read" ON public.compliance_flags
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "flags_pm_write" ON public.compliance_flags
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- Activity log is readable by all internal users but only writable by service role
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_internal_read" ON public.activity_log
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- activity_log: INSERT only via service role (API routes) -- no client-side write policy

-- Notifications scoped to recipient only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_recipient" ON public.notifications
  FOR ALL USING (recipient_id = auth.uid() AND public.is_internal());
