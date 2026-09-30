-- Backend Schema §2.4: vendor_invites — kept permanently for audit. Expiry enforced in app logic.
CREATE TABLE public.vendor_invites (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id             uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  vendor_account_id  uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  invited_by         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  token              text UNIQUE NOT NULL,      -- Cryptographically random, 64 chars
  status             public.invite_status NOT NULL DEFAULT 'pending',
  personal_message   text,
  expires_at         timestamptz NOT NULL,      -- created_at + 72 hours
  accepted_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendor_invites_token_idx ON public.vendor_invites (token);
CREATE INDEX vendor_invites_rfp_idx   ON public.vendor_invites (rfp_id);
