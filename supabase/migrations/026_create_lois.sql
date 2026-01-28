-- LOIs (Letters of Intent) - lease negotiation tracking
-- Tracks proposal/counter lifecycle for vacancies
-- Team ownership resolved via vacancy → suite → asset → portfolio chain
-- Status and direction will be enums later per PRD (using text for now)

CREATE TABLE public.lois (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  vacancy_id uuid NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  status text,
  direction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_lois_vacancy_id ON public.lois(vacancy_id);
CREATE INDEX idx_lois_status ON public.lois(status) WHERE status IS NOT NULL;
CREATE INDEX idx_lois_vacancy_not_deleted ON public.lois(vacancy_id, is_deleted);

COMMENT ON TABLE public.lois IS 'Letters of Intent - lease negotiation tracking (status/direction enums TBD)';
COMMENT ON COLUMN public.lois.status IS 'LOI lifecycle status (enum to be defined per PRD)';
COMMENT ON COLUMN public.lois.direction IS 'Proposal/counter direction (enum to be defined per PRD)';
