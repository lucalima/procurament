-- Backend Schema §2.11: evaluation_criteria — one row per criterion per RFP.
CREATE TABLE public.evaluation_criteria (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  evaluation_id   uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  weight          numeric(5,2) NOT NULL,  -- percentage, all criteria for an eval must sum to 100
  sort_order      int NOT NULL DEFAULT 0,
  is_ai_suggested boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Weights must sum to 100 per evaluation: enforced in the app and by the
-- criteria_weight_check trigger (0023).
