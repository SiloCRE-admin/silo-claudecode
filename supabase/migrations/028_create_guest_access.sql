-- Guest users and access grants
-- Guests exist outside team membership and only access explicitly granted assets/suites
-- Guest access is scoped to portfolio, asset, or suite level

-- Guest users table - references auth.users for authentication
CREATE TABLE public.guest_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_users_email ON public.guest_users(email);

-- Guest access grants - portfolio/asset/suite scoped permissions
-- Uses partial unique indexes to prevent duplicate grants at each scope level
CREATE TABLE public.guest_access (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  guest_user_id uuid NOT NULL REFERENCES public.guest_users(user_id) ON DELETE CASCADE,
  portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  suite_id uuid REFERENCES public.suites(id) ON DELETE CASCADE,
  permission public.guest_permission NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),

  -- At least one scope must be specified
  CONSTRAINT guest_access_scope_required CHECK (
    portfolio_id IS NOT NULL OR asset_id IS NOT NULL OR suite_id IS NOT NULL
  )
);

-- Partial unique indexes to prevent duplicate grants at each scope level
CREATE UNIQUE INDEX idx_guest_access_unique_portfolio
  ON public.guest_access(guest_user_id, portfolio_id)
  WHERE portfolio_id IS NOT NULL;

CREATE UNIQUE INDEX idx_guest_access_unique_asset
  ON public.guest_access(guest_user_id, asset_id)
  WHERE asset_id IS NOT NULL;

CREATE UNIQUE INDEX idx_guest_access_unique_suite
  ON public.guest_access(guest_user_id, suite_id)
  WHERE suite_id IS NOT NULL;

-- Lookup indexes
CREATE INDEX idx_guest_access_guest_user ON public.guest_access(guest_user_id);
CREATE INDEX idx_guest_access_portfolio ON public.guest_access(portfolio_id) WHERE portfolio_id IS NOT NULL;
CREATE INDEX idx_guest_access_asset ON public.guest_access(asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX idx_guest_access_suite ON public.guest_access(suite_id) WHERE suite_id IS NOT NULL;

COMMENT ON TABLE public.guest_users IS 'Guest users - outside team membership, auth via auth.users';
COMMENT ON COLUMN public.guest_users.user_id IS 'Primary key - references auth.users for authentication';

COMMENT ON TABLE public.guest_access IS 'Asset-scoped access grants for guests (no team membership)';
COMMENT ON COLUMN public.guest_access.portfolio_id IS 'Grant access to entire portfolio (nullable)';
COMMENT ON COLUMN public.guest_access.asset_id IS 'Grant access to specific asset (nullable)';
COMMENT ON COLUMN public.guest_access.suite_id IS 'Grant access to specific suite (nullable)';
COMMENT ON CONSTRAINT guest_access_scope_required ON public.guest_access IS 'At least one of portfolio/asset/suite must be specified';
