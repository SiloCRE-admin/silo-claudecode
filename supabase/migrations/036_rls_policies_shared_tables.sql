-- RLS Policies for Shared/Reference Tables
-- God Admin boundary: God Admin can only operate on shared/reference/moderation tables
-- God Admin MUST NOT access team-private data

-- ============================================================================
-- TEAMS & PROFILES
-- ============================================================================

-- Teams: Users can read their own team; God Admin can read all
CREATE POLICY teams_select ON public.teams
  FOR SELECT
  USING (
    id = app.current_team_id()
    OR app.is_god_admin() = true
  );

-- Teams: Team owners can update their team; God Admin can update all
CREATE POLICY teams_update ON public.teams
  FOR UPDATE
  USING (
    id = app.current_team_id() AND app.is_team_role('team_owner') = true
    OR app.is_god_admin() = true
  );

-- Profiles: Users can read their own profile and team members
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR team_id = app.current_team_id()
    OR app.is_god_admin() = true
  );

-- Profiles: Users can update their own profile; team owners/admins can update team profiles
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (team_id = app.current_team_id() AND app.is_team_role('team_owner') = true)
    OR (team_id = app.current_team_id() AND app.is_team_role('team_admin') = true)
  );

-- ============================================================================
-- MARKETS & SUBMARKETS (Reference Data)
-- ============================================================================

-- Markets: All authenticated users can read
CREATE POLICY markets_select ON public.markets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Markets: Only God Admin can modify
CREATE POLICY markets_insert ON public.markets
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY markets_update ON public.markets
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY markets_delete ON public.markets
  FOR DELETE
  USING (app.is_god_admin() = true);

-- Submarkets: All authenticated users can read
CREATE POLICY submarkets_select ON public.submarkets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Submarkets: Only God Admin can modify
CREATE POLICY submarkets_insert ON public.submarkets
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY submarkets_update ON public.submarkets
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY submarkets_delete ON public.submarkets
  FOR DELETE
  USING (app.is_god_admin() = true);

-- ============================================================================
-- BUILDINGS (Shared Layer)
-- ============================================================================

-- Buildings: All authenticated users can read
CREATE POLICY buildings_select ON public.buildings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Buildings: Only God Admin can modify (users contribute via flags)
CREATE POLICY buildings_insert ON public.buildings
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY buildings_update ON public.buildings
  FOR UPDATE
  USING (app.is_god_admin() = true);

-- Buildings: No hard deletes (use flags/moderation)
CREATE POLICY buildings_delete ON public.buildings
  FOR DELETE
  USING (false);

-- ============================================================================
-- BUILDING ATTRIBUTES & PROVENANCE
-- ============================================================================

-- Building attributes: All authenticated users can read
CREATE POLICY building_attributes_select ON public.building_attributes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Building attributes: Only God Admin can modify
CREATE POLICY building_attributes_insert ON public.building_attributes
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY building_attributes_update ON public.building_attributes
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY building_attributes_delete ON public.building_attributes
  FOR DELETE
  USING (false);

-- Building attribute provenance: All authenticated users can read
CREATE POLICY building_attribute_provenance_select ON public.building_attribute_provenance
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Building attribute provenance: Only God Admin can modify
CREATE POLICY building_attribute_provenance_insert ON public.building_attribute_provenance
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY building_attribute_provenance_update ON public.building_attribute_provenance
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY building_attribute_provenance_delete ON public.building_attribute_provenance
  FOR DELETE
  USING (false);

-- ============================================================================
-- BUILDING FLAGS (User-Submittable)
-- ============================================================================

-- Building flags: All authenticated users can read
CREATE POLICY building_flags_select ON public.building_flags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Building flags: Authenticated users can insert flags (report issues)
CREATE POLICY building_flags_insert ON public.building_flags
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND flagged_by_user_id = auth.uid()
  );

-- Building flags: Only God Admin can update (status changes)
CREATE POLICY building_flags_update ON public.building_flags
  FOR UPDATE
  USING (app.is_god_admin() = true);

-- Building flags: No deletes
CREATE POLICY building_flags_delete ON public.building_flags
  FOR DELETE
  USING (false);

-- ============================================================================
-- ADMIN REVIEW QUEUE & LOCKED FIELDS (God Admin Only)
-- ============================================================================

-- Admin review queue: Only God Admin can access
CREATE POLICY admin_review_queue_select ON public.admin_review_queue
  FOR SELECT
  USING (app.is_god_admin() = true);

CREATE POLICY admin_review_queue_insert ON public.admin_review_queue
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY admin_review_queue_update ON public.admin_review_queue
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY admin_review_queue_delete ON public.admin_review_queue
  FOR DELETE
  USING (false);

-- Locked building fields: Only God Admin can access
CREATE POLICY locked_building_fields_select ON public.locked_building_fields
  FOR SELECT
  USING (app.is_god_admin() = true);

CREATE POLICY locked_building_fields_insert ON public.locked_building_fields
  FOR INSERT
  WITH CHECK (app.is_god_admin() = true);

CREATE POLICY locked_building_fields_update ON public.locked_building_fields
  FOR UPDATE
  USING (app.is_god_admin() = true);

CREATE POLICY locked_building_fields_delete ON public.locked_building_fields
  FOR DELETE
  USING (false);

-- ============================================================================
-- TEAM BUILDING PRESENCE (Team-Scoped Map Privacy)
-- ============================================================================

-- Team building presence: Only team members can see their team's presence
CREATE POLICY team_building_presence_select ON public.team_building_presence
  FOR SELECT
  USING (team_id = app.current_team_id());

-- Team building presence: Team can insert/update their presence
CREATE POLICY team_building_presence_insert ON public.team_building_presence
  FOR INSERT
  WITH CHECK (team_id = app.current_team_id());

CREATE POLICY team_building_presence_update ON public.team_building_presence
  FOR UPDATE
  USING (team_id = app.current_team_id());

-- Team building presence: No deletes (presence maintained automatically)
CREATE POLICY team_building_presence_delete ON public.team_building_presence
  FOR DELETE
  USING (false);
