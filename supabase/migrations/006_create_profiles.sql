-- Profiles table - canonical source for team membership and user roles
-- Rule: one user belongs to exactly one team (enforced via PK on user_id)

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text,
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_profiles_team_id ON public.profiles(team_id);

COMMENT ON TABLE public.profiles IS 'User profiles with team membership and role - canonical source for team binding';
COMMENT ON COLUMN public.profiles.user_id IS 'Primary key - references auth.users, one row per user';
COMMENT ON COLUMN public.profiles.team_id IS 'User team membership (required) - one team per user';
COMMENT ON COLUMN public.profiles.email IS 'Cached email for convenience';
