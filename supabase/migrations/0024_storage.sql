-- Backend Schema §10 #24: storage buckets + storage RLS (§9). All buckets are
-- private; files are served through signed URLs. The first path segment is
-- always the org_id.

INSERT INTO storage.buckets (id, name, public) VALUES
  ('vendor-documents',   'vendor-documents',   false),  -- {org_id}/{rfp_id}/{vendor_id}/{filename}
  ('org-assets',         'org-assets',         false),  -- {org_id}/logo.{ext}
  ('contract-documents', 'contract-documents', false)   -- {org_id}/{contract_id}/{filename}
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9.1 vendor-documents: vendor can read/write their own files,
-- internal users can read all files in their org
-- ---------------------------------------------------------------------------
CREATE POLICY "vendor_docs_vendor_write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_vendor()
);

CREATE POLICY "vendor_docs_internal_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_internal()
);

CREATE POLICY "vendor_docs_vendor_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_vendor()
);

-- ---------------------------------------------------------------------------
-- org-assets (NOTE: no policy in §9.1; added in the §9.1 style, user-approved 2026-09-30)
-- The org logo appears in the sidebar and reports, so all internal users read it.
-- ---------------------------------------------------------------------------
CREATE POLICY "org_assets_internal_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'org-assets' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_internal()
);

CREATE POLICY "org_assets_pm_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-assets' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);

CREATE POLICY "org_assets_pm_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'org-assets' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);

CREATE POLICY "org_assets_pm_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'org-assets' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);

-- ---------------------------------------------------------------------------
-- contract-documents (NOTE: no policy in §9.1; added in the §9.1 style, user-approved 2026-09-30)
-- Mirrors contracts RLS (§5.8): PM manages, Finance Approver reads.
-- ---------------------------------------------------------------------------
CREATE POLICY "contract_docs_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.get_user_role() IN ('procurement_manager', 'finance_approver')
);

CREATE POLICY "contract_docs_pm_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contract-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);

CREATE POLICY "contract_docs_pm_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);

CREATE POLICY "contract_docs_pm_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (storage.foldername(name))[1] = public.get_org_id()::text AND
  public.is_pm()
);
