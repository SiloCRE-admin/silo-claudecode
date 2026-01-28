-- Portfolios - team-owned collections of assets
-- Top level of asset management hierarchy: Portfolio → Asset → Suite
-- Supports guest access grants and soft delete

CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_portfolios_team_id ON public.portfolios(team_id);
CREATE INDEX idx_portfolios_team_not_deleted ON public.portfolios(team_id, is_deleted);

COMMENT ON TABLE public.portfolios IS 'Team-owned asset portfolios - top level of asset hierarchy';
