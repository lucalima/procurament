-- Backend Schema §2.5: requirements — procurement requirements raised by Department Heads.
CREATE TABLE public.requirements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  raised_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title          text NOT NULL,
  description    text NOT NULL,
  department     text NOT NULL,
  budget_estimate numeric(15,2),
  required_by    date,
  priority       public.requirement_priority NOT NULL DEFAULT 'medium',
  status         public.requirement_status NOT NULL DEFAULT 'draft',
  -- NOTE: rfps and requirements reference each other, so the foreign key to
  -- public.rfps(id) ON DELETE SET NULL is added in 0007 once rfps exists.
  linked_rfp_id  uuid,
  is_deleted     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
