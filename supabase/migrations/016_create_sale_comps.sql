-- Sale comps - team-private building sale transaction data
-- Supports draft/active status and soft delete

CREATE TABLE public.sale_comps (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  status public.comp_status NOT NULL DEFAULT 'draft',
  sale_date date,
  sale_price_cents bigint,
  sale_price_psf_cents integer,
  cap_rate_bps integer,
  buyer_name_raw text,
  seller_name_raw text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_sale_comps_team_id ON public.sale_comps(team_id);
CREATE INDEX idx_sale_comps_team_building ON public.sale_comps(team_id, building_id);
CREATE INDEX idx_sale_comps_team_not_deleted ON public.sale_comps(team_id, is_deleted);

COMMENT ON TABLE public.sale_comps IS 'Team-private sale comparables - building sales data';
COMMENT ON COLUMN public.sale_comps.sale_price_cents IS 'Total sale price in integer cents (bigint for large values)';
COMMENT ON COLUMN public.sale_comps.cap_rate_bps IS 'Capitalization rate in basis points (integer)';
