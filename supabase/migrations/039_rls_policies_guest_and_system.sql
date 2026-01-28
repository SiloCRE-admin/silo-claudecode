-- RLS Policies for Guest Users and Guest Access
-- Guests can see their own records
-- Team admins/owners manage guest access grants for their team's portfolios/assets/suites

-- ============================================================================
-- GUEST USERS
-- ============================================================================

-- Guests can read their own record
-- Team users can see guests who have access to their team's assets
CREATE POLICY guest_users_select ON public.guest_users
  FOR SELECT
  USING (
    -- Guest can see themselves
    user_id = auth.uid()
    OR
    -- Team users can see guests with access to their portfolios/assets/suites
    EXISTS (
      SELECT 1 FROM public.guest_access ga
      LEFT JOIN public.portfolios p ON p.id = ga.portfolio_id
      LEFT JOIN public.assets a ON a.id = ga.asset_id
      LEFT JOIN public.suites s ON s.id = ga.suite_id
      LEFT JOIN public.assets a2 ON a2.id = s.asset_id
      WHERE ga.guest_user_id = guest_users.user_id
        AND (
          p.team_id = app.current_team_id()
          OR EXISTS (
            SELECT 1 FROM public.portfolios p2
            WHERE p2.id = a.portfolio_id
              AND p2.team_id = app.current_team_id()
          )
          OR EXISTS (
            SELECT 1 FROM public.portfolios p3
            WHERE p3.id = a2.portfolio_id
              AND p3.team_id = app.current_team_id()
          )
        )
    )
  );

-- Only team admins/owners can create guest users
CREATE POLICY guest_users_insert ON public.guest_users
  FOR INSERT
  WITH CHECK (
    app.is_team_role('team_admin') = true
    OR app.is_team_role('team_owner') = true
  );

-- Only team admins/owners can update guest users
CREATE POLICY guest_users_update ON public.guest_users
  FOR UPDATE
  USING (
    app.is_team_role('team_admin') = true
    OR app.is_team_role('team_owner') = true
  );

-- Only team admins/owners can delete guest users
CREATE POLICY guest_users_delete ON public.guest_users
  FOR DELETE
  USING (
    app.is_team_role('team_admin') = true
    OR app.is_team_role('team_owner') = true
  );

-- ============================================================================
-- GUEST ACCESS
-- ============================================================================

-- Guests can see their own access grants
-- Team users can see all access grants for their team's portfolios/assets/suites
CREATE POLICY guest_access_select ON public.guest_access
  FOR SELECT
  USING (
    -- Guest can see their own grants
    guest_user_id = auth.uid()
    OR
    -- Team users can see grants for their assets
    (
      (
        portfolio_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.portfolios p
          WHERE p.id = portfolio_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        asset_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.assets a
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE a.id = asset_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        suite_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE s.id = suite_id
            AND p.team_id = app.current_team_id()
        )
      )
    )
  );

-- Only team admins/owners can create access grants for their team's assets
CREATE POLICY guest_access_insert ON public.guest_access
  FOR INSERT
  WITH CHECK (
    (app.is_team_role('team_admin') = true OR app.is_team_role('team_owner') = true)
    AND created_by = auth.uid()
    AND (
      (
        portfolio_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.portfolios p
          WHERE p.id = portfolio_id
            AND p.team_id = app.current_team_id()
            AND p.is_deleted = false
        )
      )
      OR
      (
        asset_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.assets a
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE a.id = asset_id
            AND p.team_id = app.current_team_id()
            AND a.is_deleted = false
            AND p.is_deleted = false
        )
      )
      OR
      (
        suite_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE s.id = suite_id
            AND p.team_id = app.current_team_id()
            AND s.is_deleted = false
            AND a.is_deleted = false
            AND p.is_deleted = false
        )
      )
    )
  );

-- Only team admins/owners can update access grants for their team's assets
CREATE POLICY guest_access_update ON public.guest_access
  FOR UPDATE
  USING (
    (app.is_team_role('team_admin') = true OR app.is_team_role('team_owner') = true)
    AND (
      (
        portfolio_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.portfolios p
          WHERE p.id = portfolio_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        asset_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.assets a
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE a.id = asset_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        suite_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE s.id = suite_id
            AND p.team_id = app.current_team_id()
        )
      )
    )
  );

-- Only team admins/owners can delete access grants for their team's assets
CREATE POLICY guest_access_delete ON public.guest_access
  FOR DELETE
  USING (
    (app.is_team_role('team_admin') = true OR app.is_team_role('team_owner') = true)
    AND (
      (
        portfolio_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.portfolios p
          WHERE p.id = portfolio_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        asset_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.assets a
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE a.id = asset_id
            AND p.team_id = app.current_team_id()
        )
      )
      OR
      (
        suite_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE s.id = suite_id
            AND p.team_id = app.current_team_id()
        )
      )
    )
  );
