-- Backend Schema §2.17: activity_log — immutable audit trail with before/after JSONB diff.
CREATE TABLE public.activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_id        uuid,             -- profiles.id or vendor_accounts.id, nullable for system events
  actor_type      text,             -- 'profile' | 'vendor' | 'system'
  entity_type     public.activity_entity NOT NULL,
  entity_id       uuid NOT NULL,
  action          text NOT NULL,    -- e.g. 'rfp.status_changed', 'score.overridden'
  description     text NOT NULL,    -- Human-readable summary
  before_state    jsonb,            -- Record state before change
  after_state     jsonb,            -- Record state after change
  metadata        jsonb,            -- Extra context (e.g. RFP id when vendor status changes)
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- activity_log is APPEND-ONLY. No updates or deletes ever.
CREATE INDEX activity_log_org_idx      ON public.activity_log (org_id, created_at DESC);
CREATE INDEX activity_log_entity_idx   ON public.activity_log (entity_type, entity_id);
CREATE INDEX activity_log_actor_idx    ON public.activity_log (actor_id);
