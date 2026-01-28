-- Developments - team-private development pipeline tracking
-- Tracks planned/active/delivered construction projects
-- Supports soft delete

CREATE TABLE public.developments (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  status public.development_status NOT NULL DEFAULT 'planned',
  estimated_delivery_date date,
  developer text,
  size_sf integer,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_developments_team_id ON public.developments(team_id);
CREATE INDEX idx_developments_team_building ON public.developments(team_id, building_id);
CREATE INDEX idx_developments_status ON public.developments(status);
CREATE INDEX idx_developments_team_not_deleted ON public.developments(team_id, is_deleted);

COMMENT ON TABLE public.developments IS 'Team-private development pipeline tracking';
COMMENT ON COLUMN public.developments.status IS 'Development lifecycle status';
COMMENT ON COLUMN public.developments.active IS 'Whether development is currently active/relevant';
