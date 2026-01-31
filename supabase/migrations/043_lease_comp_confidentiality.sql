-- Add confidentiality columns to lease_comps
-- Updates SELECT + UPDATE RLS to enforce internal access level
--
-- Default 'all_team' preserves existing visibility for all current rows.
-- Export detail level is application-enforced (field redaction), not RLS.

-- ============================================================================
-- ADD COLUMNS
-- ============================================================================

ALTER TABLE public.lease_comps
  ADD COLUMN internal_access_level public.internal_access_level NOT NULL DEFAULT 'all_team',
  ADD COLUMN export_detail_level public.export_detail_level NOT NULL DEFAULT 'all_visible';

COMMENT ON COLUMN public.lease_comps.internal_access_level IS 'Controls which team members can see this comp';
COMMENT ON COLUMN public.lease_comps.export_detail_level IS 'Controls field visibility in exports (app-enforced)';

-- ============================================================================
-- UPDATE SELECT POLICY
-- ============================================================================
-- Preserves existing team + soft-delete + draft checks from 037.
-- Adds confidentiality filter based on internal_access_level.

DROP POLICY IF EXISTS lease_comps_select ON public.lease_comps;

CREATE POLICY lease_comps_select ON public.lease_comps
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
    AND (
      internal_access_level = 'all_team'
      OR (internal_access_level = 'owner_admin_me'
          AND (app.is_team_role('team_owner') = true
               OR app.is_team_role('team_admin') = true
               OR created_by = auth.uid()))
      OR (internal_access_level = 'owner_me'
          AND (app.is_team_role('team_owner') = true
               OR created_by = auth.uid()))
      OR (internal_access_level = 'just_me'
          AND created_by = auth.uid())
    )
  );

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Must also enforce confidentiality: a user who cannot see the comp
-- must not be able to update it even if they know the ID.

DROP POLICY IF EXISTS lease_comps_update ON public.lease_comps;

CREATE POLICY lease_comps_update ON public.lease_comps
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
    AND (
      internal_access_level = 'all_team'
      OR (internal_access_level = 'owner_admin_me'
          AND (app.is_team_role('team_owner') = true
               OR app.is_team_role('team_admin') = true
               OR created_by = auth.uid()))
      OR (internal_access_level = 'owner_me'
          AND (app.is_team_role('team_owner') = true
               OR created_by = auth.uid()))
      OR (internal_access_level = 'just_me'
          AND created_by = auth.uid())
    )
  );
