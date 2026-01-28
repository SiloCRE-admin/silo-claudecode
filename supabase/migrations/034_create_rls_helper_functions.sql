-- RLS Helper Functions
-- All functions in app schema with SECURITY DEFINER for elevated permissions
-- Used by RLS policies to enforce team isolation, role checks, and guest access

-- Get current user's team ID from profiles table (canonical source)
CREATE OR REPLACE FUNCTION app.current_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.team_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;

COMMENT ON FUNCTION app.current_team_id() IS 'Returns current user team ID from profiles (canonical source)';

-- Get current user's role from profiles table
CREATE OR REPLACE FUNCTION app.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;

COMMENT ON FUNCTION app.current_role() IS 'Returns current user role as text';

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION app.is_team_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role::text = role_name
  )
$$;

COMMENT ON FUNCTION app.is_team_role(text) IS 'Check if current user has specific role';

-- Check if current user is a God Admin
-- God Admin flag is set in auth.users app_metadata.role = 'god_admin'
CREATE OR REPLACE FUNCTION app.is_god_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'god_admin',
    false
  )
$$;

COMMENT ON FUNCTION app.is_god_admin() IS 'Check if current user is God Admin via JWT app_metadata';

-- Check if current user is a guest
CREATE OR REPLACE FUNCTION app.is_guest()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_users gu
    WHERE gu.user_id = auth.uid()
  )
$$;

COMMENT ON FUNCTION app.is_guest() IS 'Check if current user exists in guest_users table';

-- Check if current user (guest) has access to a specific portfolio
CREATE OR REPLACE FUNCTION app.has_portfolio_access(portfolio uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND ga.portfolio_id = portfolio
  )
$$;

COMMENT ON FUNCTION app.has_portfolio_access(uuid) IS 'Check if guest has access to specific portfolio';

-- Check if current user (guest) has access to a specific asset
-- Access granted via direct asset grant OR parent portfolio grant
CREATE OR REPLACE FUNCTION app.has_asset_access(asset uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND (
        ga.asset_id = asset
        OR ga.portfolio_id = (
          SELECT a.portfolio_id
          FROM public.assets a
          WHERE a.id = asset
        )
      )
  )
$$;

COMMENT ON FUNCTION app.has_asset_access(uuid) IS 'Check if guest has access to asset (direct or via portfolio)';

-- Check if current user (guest) has access to a specific suite
-- Access granted via direct suite grant OR parent asset grant OR parent portfolio grant
CREATE OR REPLACE FUNCTION app.has_suite_access(suite uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND (
        ga.suite_id = suite
        OR ga.asset_id = (
          SELECT s.asset_id
          FROM public.suites s
          WHERE s.id = suite
        )
        OR ga.portfolio_id = (
          SELECT a.portfolio_id
          FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          WHERE s.id = suite
        )
      )
  )
$$;

COMMENT ON FUNCTION app.has_suite_access(uuid) IS 'Check if guest has access to suite (direct, asset, or portfolio)';
