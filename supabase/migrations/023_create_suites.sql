-- Suites - rentable units within assets
-- Supports detailed occupancy/vacancy status tracking per PRD
-- Team ownership resolved via asset → portfolio chain
-- Supports guest access grants and soft delete

CREATE TABLE public.suites (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  suite_name text NOT NULL,
  square_feet integer,
  status public.suite_status NOT NULL DEFAULT 'other_off_market',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_suites_asset_id ON public.suites(asset_id);
CREATE INDEX idx_suites_status ON public.suites(status);
CREATE INDEX idx_suites_asset_not_deleted ON public.suites(asset_id, is_deleted);

COMMENT ON TABLE public.suites IS 'Rentable units within assets - detailed occupancy status tracking';
COMMENT ON COLUMN public.suites.status IS 'Detailed suite occupancy/vacancy status per PRD (10 values)';
