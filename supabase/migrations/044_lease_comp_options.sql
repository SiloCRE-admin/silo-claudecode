-- Lease Comp Options: 4 repeatable sub-record tables
-- Renewal, Termination, Expansion/ROFR, Purchase
--
-- All option fields are nullable (spec: "no required fields to save").
-- Options use hard delete (not soft delete) — they are child records.
-- RLS inherits confidentiality from parent lease_comp via EXISTS subquery.

-- ============================================================================
-- RENEWAL OPTIONS
-- ============================================================================

CREATE TABLE public.lease_comp_renewal_options (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),
  option_number   smallint NOT NULL,

  -- Exercise Window
  exercise_window_type  public.exercise_window_type,
  exercise_deadline     date,
  window_start_date     date,
  window_end_date       date,
  rolling_trigger_type  public.rolling_trigger_type,
  rolling_trigger_months integer,
  rolling_trigger_date  date,

  -- Notice
  notice_method         public.notice_method,
  notice_days_prior     integer,
  notice_fixed_date     date,

  -- Renewal Term
  renewal_term_months   integer,

  -- Rate
  rate_basis            public.renewal_rate_basis,
  pct_of_fmv            numeric(5,2),

  -- Rate Floor
  floor_type            public.floor_cap_type,
  floor_value           numeric(12,2),
  floor_override_text   text,

  -- Rate Cap
  cap_type              public.floor_cap_type,
  cap_value             numeric(12,2),
  cap_override_text     text,

  -- CPI (only if rate_basis = cpi_adjustment)
  cpi_index             text,
  cpi_frequency         public.cpi_frequency,
  cpi_min               text,
  cpi_max               text,

  commentary            text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id),

  UNIQUE (lease_comp_id, option_number)
);

COMMENT ON TABLE public.lease_comp_renewal_options IS 'Repeatable renewal option sub-records per lease comp';

CREATE INDEX idx_renewal_options_comp ON public.lease_comp_renewal_options(lease_comp_id);
CREATE INDEX idx_renewal_options_team ON public.lease_comp_renewal_options(team_id);

ALTER TABLE public.lease_comp_renewal_options ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit visibility from parent lease_comp (includes confidentiality)
CREATE POLICY renewal_options_select ON public.lease_comp_renewal_options
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY renewal_options_insert ON public.lease_comp_renewal_options
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY renewal_options_update ON public.lease_comp_renewal_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY renewal_options_delete ON public.lease_comp_renewal_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- ============================================================================
-- TERMINATION OPTIONS
-- ============================================================================

CREATE TABLE public.lease_comp_termination_options (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),
  option_number   smallint NOT NULL,

  -- Type
  type                  public.termination_option_type,

  -- Exercise Window (constrained by type at app layer)
  exercise_window_type  public.exercise_window_type,
  exercise_deadline     date,
  window_start_date     date,
  window_end_date       date,
  rolling_trigger_type  public.rolling_trigger_type,
  rolling_trigger_months integer,
  rolling_trigger_date  date,

  -- Notice
  notice_method         public.notice_method,
  notice_days_prior     integer,
  notice_fixed_date     date,

  termination_fee_cents integer,
  commentary            text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id),

  UNIQUE (lease_comp_id, option_number)
);

COMMENT ON TABLE public.lease_comp_termination_options IS 'Repeatable termination option sub-records per lease comp';

CREATE INDEX idx_termination_options_comp ON public.lease_comp_termination_options(lease_comp_id);
CREATE INDEX idx_termination_options_team ON public.lease_comp_termination_options(team_id);

ALTER TABLE public.lease_comp_termination_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY termination_options_select ON public.lease_comp_termination_options
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY termination_options_insert ON public.lease_comp_termination_options
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY termination_options_update ON public.lease_comp_termination_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY termination_options_delete ON public.lease_comp_termination_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- ============================================================================
-- EXPANSION / ROFR OPTIONS
-- ============================================================================

CREATE TABLE public.lease_comp_expansion_options (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),
  option_number   smallint NOT NULL,

  type                  public.expansion_option_type,
  subject_suite         text,
  decision_window_days  integer,
  timing                public.expansion_timing,
  timing_date           date,
  rate_basis            public.expansion_rate_basis,
  commentary            text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id),

  UNIQUE (lease_comp_id, option_number)
);

COMMENT ON TABLE public.lease_comp_expansion_options IS 'Repeatable expansion/ROFR option sub-records per lease comp';

CREATE INDEX idx_expansion_options_comp ON public.lease_comp_expansion_options(lease_comp_id);
CREATE INDEX idx_expansion_options_team ON public.lease_comp_expansion_options(team_id);

ALTER TABLE public.lease_comp_expansion_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY expansion_options_select ON public.lease_comp_expansion_options
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY expansion_options_insert ON public.lease_comp_expansion_options
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY expansion_options_update ON public.lease_comp_expansion_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY expansion_options_delete ON public.lease_comp_expansion_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- ============================================================================
-- PURCHASE OPTIONS
-- ============================================================================

CREATE TABLE public.lease_comp_purchase_options (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),
  option_number   smallint NOT NULL,

  structure             public.purchase_structure,

  -- Exercise Window
  exercise_window_type  public.exercise_window_type,
  exercise_deadline     date,
  window_start_date     date,
  window_end_date       date,
  rolling_trigger_type  public.rolling_trigger_type,
  rolling_trigger_months integer,
  rolling_trigger_date  date,

  -- Notice
  notice_method         public.notice_method,
  notice_days_prior     integer,
  notice_fixed_date     date,

  -- Pricing
  price_basis           public.purchase_price_basis,
  purchase_price_cents  bigint,
  pricing_formula       text,

  commentary            text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id),

  UNIQUE (lease_comp_id, option_number)
);

COMMENT ON TABLE public.lease_comp_purchase_options IS 'Repeatable purchase option sub-records per lease comp';

CREATE INDEX idx_purchase_options_comp ON public.lease_comp_purchase_options(lease_comp_id);
CREATE INDEX idx_purchase_options_team ON public.lease_comp_purchase_options(team_id);

ALTER TABLE public.lease_comp_purchase_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_options_select ON public.lease_comp_purchase_options
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY purchase_options_insert ON public.lease_comp_purchase_options
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY purchase_options_update ON public.lease_comp_purchase_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY purchase_options_delete ON public.lease_comp_purchase_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );
