-- Market chatter - team-private market intelligence notes
-- Supports tagging with categories, buildings, contacts, markets, submarkets
-- All junction tables enforce RLS via parent chatter visibility

-- Main chatter table
CREATE TABLE public.market_chatter (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id),
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_market_chatter_team_id ON public.market_chatter(team_id);
CREATE INDEX idx_market_chatter_author ON public.market_chatter(author_user_id);
CREATE INDEX idx_market_chatter_team_not_deleted ON public.market_chatter(team_id, is_deleted);

-- Chatter category flags (many-to-many)
CREATE TABLE public.market_chatter_flags (
  chatter_id uuid NOT NULL REFERENCES public.market_chatter(id) ON DELETE CASCADE,
  category public.chatter_category NOT NULL,
  PRIMARY KEY (chatter_id, category)
);

CREATE INDEX idx_chatter_flags_category ON public.market_chatter_flags(category);

-- Chatter building associations (many-to-many)
CREATE TABLE public.market_chatter_buildings (
  chatter_id uuid NOT NULL REFERENCES public.market_chatter(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  PRIMARY KEY (chatter_id, building_id)
);

CREATE INDEX idx_chatter_buildings_building ON public.market_chatter_buildings(building_id);

-- Chatter contact associations (many-to-many)
CREATE TABLE public.market_chatter_contacts (
  chatter_id uuid NOT NULL REFERENCES public.market_chatter(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL,  -- FK created after contacts table
  PRIMARY KEY (chatter_id, contact_id)
);

CREATE INDEX idx_chatter_contacts_contact ON public.market_chatter_contacts(contact_id);

-- Chatter market associations (many-to-many)
CREATE TABLE public.market_chatter_markets (
  chatter_id uuid NOT NULL REFERENCES public.market_chatter(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  PRIMARY KEY (chatter_id, market_id)
);

CREATE INDEX idx_chatter_markets_market ON public.market_chatter_markets(market_id);

-- Chatter submarket associations (many-to-many)
CREATE TABLE public.market_chatter_submarkets (
  chatter_id uuid NOT NULL REFERENCES public.market_chatter(id) ON DELETE CASCADE,
  submarket_id uuid NOT NULL REFERENCES public.submarkets(id) ON DELETE CASCADE,
  PRIMARY KEY (chatter_id, submarket_id)
);

CREATE INDEX idx_chatter_submarkets_submarket ON public.market_chatter_submarkets(submarket_id);

COMMENT ON TABLE public.market_chatter IS 'Team-private market intelligence notes with tagging support';
COMMENT ON TABLE public.market_chatter_flags IS 'Chatter category tags (lease, sale, development, etc.)';
COMMENT ON TABLE public.market_chatter_buildings IS 'Associate chatter with buildings';
COMMENT ON TABLE public.market_chatter_contacts IS 'Associate chatter with contacts';
COMMENT ON TABLE public.market_chatter_markets IS 'Associate chatter with markets';
COMMENT ON TABLE public.market_chatter_submarkets IS 'Associate chatter with submarkets';
