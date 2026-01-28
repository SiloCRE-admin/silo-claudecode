-- Suite budgets - underwriting assumptions per suite
-- One budget per suite (suite_id is PK)
-- Team ownership via suite → asset → portfolio chain

CREATE TABLE public.suite_budgets (
  suite_id uuid PRIMARY KEY REFERENCES public.suites(id) ON DELETE CASCADE,
  budget_rent_psf_cents integer,
  budget_ti_cents integer,
  downtime_months integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Make ready projects - suite renovation/preparation projects
-- Team ownership via suite → asset → portfolio chain
-- Status will be enum later per PRD

CREATE TABLE public.make_ready_projects (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  suite_id uuid NOT NULL REFERENCES public.suites(id) ON DELETE CASCADE,
  description text,
  cost_cents integer,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_make_ready_suite_id ON public.make_ready_projects(suite_id);
CREATE INDEX idx_make_ready_status ON public.make_ready_projects(status) WHERE status IS NOT NULL;
CREATE INDEX idx_make_ready_suite_not_deleted ON public.make_ready_projects(suite_id, is_deleted);

COMMENT ON TABLE public.suite_budgets IS 'Underwriting budget assumptions per suite (one per suite)';
COMMENT ON COLUMN public.suite_budgets.budget_rent_psf_cents IS 'Budgeted rent per SF in integer cents';
COMMENT ON COLUMN public.suite_budgets.budget_ti_cents IS 'Budgeted TI allowance in integer cents';

COMMENT ON TABLE public.make_ready_projects IS 'Suite renovation/make-ready projects';
COMMENT ON COLUMN public.make_ready_projects.cost_cents IS 'Project cost in integer cents';
COMMENT ON COLUMN public.make_ready_projects.status IS 'Project status (enum to be defined)';
