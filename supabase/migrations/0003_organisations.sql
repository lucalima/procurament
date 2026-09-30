-- Backend Schema §2.1: organisations — top-level tenant. One row per customer company.
CREATE TABLE public.organisations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text UNIQUE NOT NULL,          -- URL-safe identifier
  logo_url       text,                          -- Supabase Storage path
  currency       text NOT NULL DEFAULT 'USD',
  is_deleted     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
