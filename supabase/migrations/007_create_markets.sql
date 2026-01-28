-- Markets table - top-level geographic market definitions (system-managed)

CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  name text NOT NULL
);

CREATE INDEX idx_markets_name ON public.markets(name);

COMMENT ON TABLE public.markets IS 'Geographic markets (e.g., Dallas-Fort Worth) - system-managed reference data';
