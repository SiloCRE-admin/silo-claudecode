-- RLS Policies for Asset Management Tables
-- Team access via portfolio ownership chain
-- Guest access via app.has_*_access() helper functions
-- Guests can UPDATE/DELETE only rows they created (created_by = auth.uid())
-- No hard deletes - soft delete only via UPDATE

-- ============================================================================
-- PORTFOLIOS
-- ============================================================================

CREATE POLICY portfolios_select ON public.portfolios
  FOR SELECT
  USING (
    (team_id = app.current_team_id() AND is_deleted = false)
    OR app.has_portfolio_access(id) = true
  );

CREATE POLICY portfolios_insert ON public.portfolios
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY portfolios_update ON public.portfolios
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

-- No hard deletes
CREATE POLICY portfolios_delete ON public.portfolios
  FOR DELETE
  USING (false);

-- ============================================================================
-- ASSETS
-- ============================================================================

CREATE POLICY assets_select ON public.assets
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.portfolios p
        WHERE p.id = portfolio_id
          AND p.team_id = app.current_team_id()
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR app.has_asset_access(id) = true
  );

CREATE POLICY assets_insert ON public.assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id
        AND p.team_id = app.current_team_id()
        AND p.is_deleted = false
    )
    AND created_by = auth.uid()
  );

CREATE POLICY assets_update ON public.assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios p
      WHERE p.id = portfolio_id
        AND p.team_id = app.current_team_id()
        AND p.is_deleted = false
    )
    AND is_deleted = false
  );

-- No hard deletes
CREATE POLICY assets_delete ON public.assets
  FOR DELETE
  USING (false);

-- ============================================================================
-- SUITES
-- ============================================================================

CREATE POLICY suites_select ON public.suites
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.assets a
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE a.id = asset_id
          AND p.team_id = app.current_team_id()
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR app.has_suite_access(id) = true
  );

CREATE POLICY suites_insert ON public.suites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets a
      JOIN public.portfolios p ON p.id = a.portfolio_id
      WHERE a.id = asset_id
        AND p.team_id = app.current_team_id()
        AND a.is_deleted = false
        AND p.is_deleted = false
    )
    AND created_by = auth.uid()
  );

CREATE POLICY suites_update ON public.suites
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.assets a
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE a.id = asset_id
          AND p.team_id = app.current_team_id()
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      app.has_suite_access(id) = true
      AND created_by = auth.uid()
    )
  );

-- No hard deletes
CREATE POLICY suites_delete ON public.suites
  FOR DELETE
  USING (false);

-- ============================================================================
-- VACANCIES
-- ============================================================================

CREATE POLICY vacancies_select ON public.vacancies
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.suites s
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE s.id = suite_id
          AND p.team_id = app.current_team_id()
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR app.has_suite_access(suite_id) = true
  );

CREATE POLICY vacancies_insert ON public.vacancies
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
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
      OR (
        app.has_suite_access(suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY vacancies_update ON public.vacancies
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.suites s
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE s.id = suite_id
          AND p.team_id = app.current_team_id()
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      app.has_suite_access(suite_id) = true
      AND created_by = auth.uid()
      AND is_deleted = false
    )
  );

-- No hard deletes
CREATE POLICY vacancies_delete ON public.vacancies
  FOR DELETE
  USING (false);

-- ============================================================================
-- PROSPECTS
-- ============================================================================

CREATE POLICY prospects_select ON public.prospects
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE v.id = vacancy_id
          AND p.team_id = app.current_team_id()
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.id = vacancy_id
        AND app.has_suite_access(v.suite_id) = true
    )
  );

CREATE POLICY prospects_insert ON public.prospects
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
          SELECT 1 FROM public.vacancies v
          JOIN public.suites s ON s.id = v.suite_id
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE v.id = vacancy_id
            AND p.team_id = app.current_team_id()
            AND v.is_deleted = false
            AND s.is_deleted = false
            AND a.is_deleted = false
            AND p.is_deleted = false
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.vacancies v
        WHERE v.id = vacancy_id
          AND app.has_suite_access(v.suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY prospects_update ON public.prospects
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE v.id = vacancy_id
          AND p.team_id = app.current_team_id()
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        WHERE v.id = vacancy_id
          AND app.has_suite_access(v.suite_id) = true
      )
      AND created_by = auth.uid()
      AND is_deleted = false
    )
  );

-- No hard deletes
CREATE POLICY prospects_delete ON public.prospects
  FOR DELETE
  USING (false);

-- ============================================================================
-- TOURS
-- ============================================================================

CREATE POLICY tours_select ON public.tours
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.prospects pr
        JOIN public.vacancies v ON v.id = pr.vacancy_id
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE pr.id = prospect_id
          AND p.team_id = app.current_team_id()
          AND pr.is_deleted = false
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR EXISTS (
      SELECT 1 FROM public.prospects pr
      JOIN public.vacancies v ON v.id = pr.vacancy_id
      WHERE pr.id = prospect_id
        AND app.has_suite_access(v.suite_id) = true
    )
  );

CREATE POLICY tours_insert ON public.tours
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
          SELECT 1 FROM public.prospects pr
          JOIN public.vacancies v ON v.id = pr.vacancy_id
          JOIN public.suites s ON s.id = v.suite_id
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE pr.id = prospect_id
            AND p.team_id = app.current_team_id()
            AND pr.is_deleted = false
            AND v.is_deleted = false
            AND s.is_deleted = false
            AND a.is_deleted = false
            AND p.is_deleted = false
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.prospects pr
        JOIN public.vacancies v ON v.id = pr.vacancy_id
        WHERE pr.id = prospect_id
          AND app.has_suite_access(v.suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY tours_update ON public.tours
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.prospects pr
        JOIN public.vacancies v ON v.id = pr.vacancy_id
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE pr.id = prospect_id
          AND p.team_id = app.current_team_id()
          AND pr.is_deleted = false
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.prospects pr
        JOIN public.vacancies v ON v.id = pr.vacancy_id
        WHERE pr.id = prospect_id
          AND app.has_suite_access(v.suite_id) = true
      )
      AND created_by = auth.uid()
      AND is_deleted = false
    )
  );

-- No hard deletes
CREATE POLICY tours_delete ON public.tours
  FOR DELETE
  USING (false);

-- ============================================================================
-- LOIS
-- ============================================================================

CREATE POLICY lois_select ON public.lois
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE v.id = vacancy_id
          AND p.team_id = app.current_team_id()
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.id = vacancy_id
        AND app.has_suite_access(v.suite_id) = true
    )
  );

CREATE POLICY lois_insert ON public.lois
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
          SELECT 1 FROM public.vacancies v
          JOIN public.suites s ON s.id = v.suite_id
          JOIN public.assets a ON a.id = s.asset_id
          JOIN public.portfolios p ON p.id = a.portfolio_id
          WHERE v.id = vacancy_id
            AND p.team_id = app.current_team_id()
            AND v.is_deleted = false
            AND s.is_deleted = false
            AND a.is_deleted = false
            AND p.is_deleted = false
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.vacancies v
        WHERE v.id = vacancy_id
          AND app.has_suite_access(v.suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY lois_update ON public.lois
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        JOIN public.suites s ON s.id = v.suite_id
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE v.id = vacancy_id
          AND p.team_id = app.current_team_id()
          AND v.is_deleted = false
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.vacancies v
        WHERE v.id = vacancy_id
          AND app.has_suite_access(v.suite_id) = true
      )
      AND created_by = auth.uid()
      AND is_deleted = false
    )
  );

-- No hard deletes
CREATE POLICY lois_delete ON public.lois
  FOR DELETE
  USING (false);

-- ============================================================================
-- SUITE BUDGETS
-- ============================================================================

CREATE POLICY suite_budgets_select ON public.suite_budgets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.suites s
      JOIN public.assets a ON a.id = s.asset_id
      JOIN public.portfolios p ON p.id = a.portfolio_id
      WHERE s.id = suite_id
        AND p.team_id = app.current_team_id()
        AND s.is_deleted = false
        AND a.is_deleted = false
        AND p.is_deleted = false
    )
    OR app.has_suite_access(suite_id) = true
  );

CREATE POLICY suite_budgets_insert ON public.suite_budgets
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
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
      OR (
        app.has_suite_access(suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY suite_budgets_update ON public.suite_budgets
  FOR UPDATE
  USING (
    (
      EXISTS (
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
    OR (
      app.has_suite_access(suite_id) = true
      AND created_by = auth.uid()
    )
  );

-- No hard deletes (suite_id is PK, delete by deleting suite)
CREATE POLICY suite_budgets_delete ON public.suite_budgets
  FOR DELETE
  USING (false);

-- ============================================================================
-- MAKE READY PROJECTS
-- ============================================================================

CREATE POLICY make_ready_projects_select ON public.make_ready_projects
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.suites s
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE s.id = suite_id
          AND p.team_id = app.current_team_id()
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR app.has_suite_access(suite_id) = true
  );

CREATE POLICY make_ready_projects_insert ON public.make_ready_projects
  FOR INSERT
  WITH CHECK (
    (
      (
        EXISTS (
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
      OR (
        app.has_suite_access(suite_id) = true
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY make_ready_projects_update ON public.make_ready_projects
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.suites s
        JOIN public.assets a ON a.id = s.asset_id
        JOIN public.portfolios p ON p.id = a.portfolio_id
        WHERE s.id = suite_id
          AND p.team_id = app.current_team_id()
          AND s.is_deleted = false
          AND a.is_deleted = false
          AND p.is_deleted = false
      )
      AND is_deleted = false
    )
    OR (
      app.has_suite_access(suite_id) = true
      AND created_by = auth.uid()
      AND is_deleted = false
    )
  );

-- No hard deletes
CREATE POLICY make_ready_projects_delete ON public.make_ready_projects
  FOR DELETE
  USING (false);
