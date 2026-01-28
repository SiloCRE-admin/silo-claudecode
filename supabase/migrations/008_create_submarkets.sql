-- Submarkets table - sub-regions within markets (system-managed)

CREATE TABLE public.submarkets (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE INDEX idx_submarkets_market_id ON public.submarkets(market_id);
CREATE INDEX idx_submarkets_name ON public.submarkets(name);

COMMENT ON TABLE public.submarkets IS 'Submarkets within geographic markets (e.g., Uptown Dallas) - system-managed';
