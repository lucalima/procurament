-- Backend Schema §2.18: notifications — in-app notifications. Soft read, purged after 90 days.
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  recipient_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            public.notification_type NOT NULL,
  title           text NOT NULL,
  body            text NOT NULL,
  entity_type     text,         -- e.g. 'rfp', 'contract'
  entity_id       uuid,         -- deep link target
  is_read         boolean NOT NULL DEFAULT false,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_idx
  ON public.notifications (recipient_id, is_read, created_at DESC);
