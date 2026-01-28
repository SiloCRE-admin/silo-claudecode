-- Land comps - team-private land sale transaction data
-- Supports draft/active status and soft delete
-- Note: Uses acres as numeric(12,2) for precise decimal representation

CREATE TABLE public.land_comps (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  parcel_id uuid,
  status public.comp_status NOT NULL DEFAULT 'draft',
  sale_date date,
  sale_price_cents bigint,
  acres numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_land_comps_team_id ON public.land_comps(team_id);
CREATE INDEX idx_land_comps_team_not_deleted ON public.land_comps(team_id, is_deleted);

COMMENT ON TABLE public.land_comps IS 'Team-private land sale comparables';
COMMENT ON COLUMN public.land_comps.parcel_id IS 'Optional future FK to parcels table';
COMMENT ON COLUMN public.land_comps.acres IS 'Land area in acres (decimal precision for accuracy)';
COMMENT ON COLUMN public.land_comps.sale_price_cents IS 'Total sale price in integer cents (bigint)';
