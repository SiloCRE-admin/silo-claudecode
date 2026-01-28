-- Team building presence - map privacy enforcement
-- Tracks which teams have data at which buildings to prevent map data leakage
-- Team-scoped; never visible cross-team

CREATE TABLE public.team_building_presence (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (team_id, building_id)
);

CREATE INDEX idx_team_building_presence_building_id ON public.team_building_presence(building_id);

COMMENT ON TABLE public.team_building_presence IS 'Tracks team data presence at buildings for map privacy (team-scoped, never shared)';
COMMENT ON COLUMN public.team_building_presence.team_id IS 'Team with data at this building';
COMMENT ON COLUMN public.team_building_presence.building_id IS 'Building where team has comps/assets/chatter';
