-- Vacancies - active vacancy tracking for suites
-- Team ownership resolved via suite → asset → portfolio chain
-- Supports soft delete

CREATE TABLE public.vacancies (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  suite_id uuid NOT NULL REFERENCES public.suites(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_vacancies_suite_id ON public.vacancies(suite_id);
CREATE INDEX idx_vacancies_suite_not_deleted ON public.vacancies(suite_id, is_deleted);

COMMENT ON TABLE public.vacancies IS 'Active vacancy tracking - ownership via suite → asset → portfolio';
