-- Assets - buildings within portfolios
-- Links portfolio ownership to shared building layer
-- Team ownership resolved via portfolio chain
-- Supports guest access grants and soft delete

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_assets_portfolio_id ON public.assets(portfolio_id);
CREATE INDEX idx_assets_building_id ON public.assets(building_id);
CREATE INDEX idx_assets_portfolio_not_deleted ON public.assets(portfolio_id, is_deleted);

COMMENT ON TABLE public.assets IS 'Buildings within portfolios - links team ownership to shared building layer';
COMMENT ON COLUMN public.assets.portfolio_id IS 'Parent portfolio (determines team ownership)';
