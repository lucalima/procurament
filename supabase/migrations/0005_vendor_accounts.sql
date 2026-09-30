-- Backend Schema §2.3: vendor_accounts — one record per vendor invite, scoped to one org.
CREATE TABLE public.vendor_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  auth_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL until invite accepted
  company_name   text NOT NULL,
  contact_name   text NOT NULL,
  email          text NOT NULL,
  is_active      boolean NOT NULL DEFAULT false,  -- true after invite accepted
  is_deleted     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate vendor email per org
CREATE UNIQUE INDEX vendor_email_per_org
  ON public.vendor_accounts (org_id, lower(email))
  WHERE is_deleted = false;

-- Backend Schema §7: full-text search column for global search
ALTER TABLE public.vendor_accounts
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(company_name,'') || ' ' || coalesce(contact_name,''))
  ) STORED;

CREATE INDEX vendor_accounts_search_idx
  ON public.vendor_accounts USING GIN (search_vector);
