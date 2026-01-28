-- Buildings table - shared layer for all building data (crowdsourced, moderated)
-- Accessible to all authenticated users; writable only by God Admin
-- Never hard deleted (use flags/moderation for corrections)

CREATE TABLE public.buildings (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  name text,
  full_address_raw text,
  address_normalized jsonb,
  address_components jsonb,
  city text,
  county text,
  state text,
  postal_code text,
  market_id uuid REFERENCES public.markets(id),
  submarket_id uuid REFERENCES public.submarkets(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  location_geog geography(Point, 4326),
  coordinate_source public.coordinate_source,
  coordinate_confirmed boolean DEFAULT false,
  building_sf integer,
  clear_height integer,
  year_built integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Spatial index for location-based queries
CREATE INDEX idx_buildings_location_geog ON public.buildings USING GIST(location_geog);

-- Standard lookup indexes
CREATE INDEX idx_buildings_market_id ON public.buildings(market_id);
CREATE INDEX idx_buildings_submarket_id ON public.buildings(submarket_id);
CREATE INDEX idx_buildings_city ON public.buildings(city);
CREATE INDEX idx_buildings_state ON public.buildings(state);
CREATE INDEX idx_buildings_postal_code ON public.buildings(postal_code);

COMMENT ON TABLE public.buildings IS 'Shared building layer - crowdsourced and moderated, never hard deleted';
COMMENT ON COLUMN public.buildings.location_geog IS 'PostGIS geography point (WGS84) for spatial queries';
COMMENT ON COLUMN public.buildings.coordinate_source IS 'Source of lat/lng coordinates (precedence: admin > user > google)';
COMMENT ON COLUMN public.buildings.address_normalized IS 'Normalized address structure (JSONB)';
