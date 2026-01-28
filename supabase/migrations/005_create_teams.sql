-- Teams table - tenant boundary for multi-tenant isolation
-- Each team is a separate organization with complete data isolation

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.teams IS 'Organizations/tenants - each team has isolated data access';
COMMENT ON COLUMN public.teams.id IS 'UUID v7 primary key';
COMMENT ON COLUMN public.teams.created_by IS 'User who created team (null for system-created teams)';
