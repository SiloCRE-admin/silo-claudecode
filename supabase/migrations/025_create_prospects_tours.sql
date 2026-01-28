-- Prospects - prospective tenants for vacancies
-- Links vacancies to contacts (CRM)
-- Team ownership resolved via vacancy → suite → asset → portfolio chain

CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  vacancy_id uuid NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_prospects_vacancy_id ON public.prospects(vacancy_id);
CREATE INDEX idx_prospects_contact_id ON public.prospects(contact_id);
CREATE INDEX idx_prospects_vacancy_not_deleted ON public.prospects(vacancy_id, is_deleted);

-- Tours - scheduled property tours for prospects
CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tour_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_tours_prospect_id ON public.tours(prospect_id);
CREATE INDEX idx_tours_tour_date ON public.tours(tour_date);
CREATE INDEX idx_tours_prospect_not_deleted ON public.tours(prospect_id, is_deleted);

COMMENT ON TABLE public.prospects IS 'Prospective tenants for vacancies - links to CRM contacts';
COMMENT ON TABLE public.tours IS 'Scheduled property tours for prospects';
