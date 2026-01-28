-- RLS Policies for Team-Private Tables
-- Standard pattern: team_id scoped, soft delete enforced, draft visibility (creator-only until active)
-- DELETE policies use USING(false) - soft delete only via UPDATE

-- ============================================================================
-- LEASE COMPS
-- ============================================================================

CREATE POLICY lease_comps_select ON public.lease_comps
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
    AND (status != 'draft' OR created_by = auth.uid())
  );

CREATE POLICY lease_comps_insert ON public.lease_comps
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY lease_comps_update ON public.lease_comps
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

-- No hard deletes - soft delete only
CREATE POLICY lease_comps_delete ON public.lease_comps
  FOR DELETE
  USING (false);

-- ============================================================================
-- SALE COMPS
-- ============================================================================

CREATE POLICY sale_comps_select ON public.sale_comps
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
    AND (status != 'draft' OR created_by = auth.uid())
  );

CREATE POLICY sale_comps_insert ON public.sale_comps
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY sale_comps_update ON public.sale_comps
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY sale_comps_delete ON public.sale_comps
  FOR DELETE
  USING (false);

-- ============================================================================
-- LAND COMPS
-- ============================================================================

CREATE POLICY land_comps_select ON public.land_comps
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
    AND (status != 'draft' OR created_by = auth.uid())
  );

CREATE POLICY land_comps_insert ON public.land_comps
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY land_comps_update ON public.land_comps
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY land_comps_delete ON public.land_comps
  FOR DELETE
  USING (false);

-- ============================================================================
-- DEVELOPMENTS
-- ============================================================================

CREATE POLICY developments_select ON public.developments
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY developments_insert ON public.developments
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY developments_update ON public.developments
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY developments_delete ON public.developments
  FOR DELETE
  USING (false);

-- ============================================================================
-- MARKET CHATTER
-- ============================================================================

CREATE POLICY market_chatter_select ON public.market_chatter
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY market_chatter_insert ON public.market_chatter
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
    AND author_user_id = auth.uid()
  );

CREATE POLICY market_chatter_update ON public.market_chatter
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY market_chatter_delete ON public.market_chatter
  FOR DELETE
  USING (false);

-- ============================================================================
-- MARKET CHATTER JUNCTION TABLES (CRITICAL - MUST HAVE RLS)
-- Access controlled via parent market_chatter visibility
-- ============================================================================

-- Market chatter flags
CREATE POLICY market_chatter_flags_select ON public.market_chatter_flags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_flags_insert ON public.market_chatter_flags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_flags_update ON public.market_chatter_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_flags_delete ON public.market_chatter_flags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
    )
  );

-- Market chatter buildings
CREATE POLICY market_chatter_buildings_select ON public.market_chatter_buildings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_buildings_insert ON public.market_chatter_buildings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_buildings_update ON public.market_chatter_buildings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_buildings_delete ON public.market_chatter_buildings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
    )
  );

-- Market chatter contacts
CREATE POLICY market_chatter_contacts_select ON public.market_chatter_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_contacts_insert ON public.market_chatter_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_contacts_update ON public.market_chatter_contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_contacts_delete ON public.market_chatter_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
    )
  );

-- Market chatter markets
CREATE POLICY market_chatter_markets_select ON public.market_chatter_markets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_markets_insert ON public.market_chatter_markets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_markets_update ON public.market_chatter_markets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_markets_delete ON public.market_chatter_markets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
    )
  );

-- Market chatter submarkets
CREATE POLICY market_chatter_submarkets_select ON public.market_chatter_submarkets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_submarkets_insert ON public.market_chatter_submarkets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_submarkets_update ON public.market_chatter_submarkets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
        AND mc.is_deleted = false
    )
  );

CREATE POLICY market_chatter_submarkets_delete ON public.market_chatter_submarkets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.market_chatter mc
      WHERE mc.id = chatter_id
        AND mc.team_id = app.current_team_id()
    )
  );

-- ============================================================================
-- CONTACTS
-- ============================================================================

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE
  USING (false);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE POLICY documents_select ON public.documents
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY documents_insert ON public.documents
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY documents_update ON public.documents
  FOR UPDATE
  USING (
    team_id = app.current_team_id()
    AND is_deleted = false
  );

CREATE POLICY documents_delete ON public.documents
  FOR DELETE
  USING (false);

-- ============================================================================
-- DOCUMENT LINKS
-- ============================================================================

CREATE POLICY document_links_select ON public.document_links
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY document_links_insert ON public.document_links
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY document_links_update ON public.document_links
  FOR UPDATE
  USING (team_id = app.current_team_id());

CREATE POLICY document_links_delete ON public.document_links
  FOR DELETE
  USING (team_id = app.current_team_id());

-- ============================================================================
-- EXTRACTION JOBS
-- ============================================================================

CREATE POLICY extraction_jobs_select ON public.extraction_jobs
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY extraction_jobs_insert ON public.extraction_jobs
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY extraction_jobs_update ON public.extraction_jobs
  FOR UPDATE
  USING (team_id = app.current_team_id());

-- Allow job cancellation/deletion
CREATE POLICY extraction_jobs_delete ON public.extraction_jobs
  FOR DELETE
  USING (team_id = app.current_team_id());

-- ============================================================================
-- EXTRACTION JOB ITEMS
-- ============================================================================

CREATE POLICY extraction_job_items_select ON public.extraction_job_items
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY extraction_job_items_insert ON public.extraction_job_items
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY extraction_job_items_update ON public.extraction_job_items
  FOR UPDATE
  USING (team_id = app.current_team_id());

-- Allow item deletion for review workflow
CREATE POLICY extraction_job_items_delete ON public.extraction_job_items
  FOR DELETE
  USING (team_id = app.current_team_id());

-- ============================================================================
-- ENTITY FIELD PROVENANCE (Append-Only)
-- ============================================================================

CREATE POLICY entity_field_provenance_select ON public.entity_field_provenance
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY entity_field_provenance_insert ON public.entity_field_provenance
  FOR INSERT
  WITH CHECK (team_id = app.current_team_id());

-- Append-only: no updates or deletes
CREATE POLICY entity_field_provenance_update ON public.entity_field_provenance
  FOR UPDATE
  USING (false);

CREATE POLICY entity_field_provenance_delete ON public.entity_field_provenance
  FOR DELETE
  USING (false);

-- ============================================================================
-- AUDIT LOG (Append-Only)
-- ============================================================================

CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND actor_user_id = auth.uid()
  );

-- Append-only: no updates or deletes
CREATE POLICY audit_log_update ON public.audit_log
  FOR UPDATE
  USING (false);

CREATE POLICY audit_log_delete ON public.audit_log
  FOR DELETE
  USING (false);

-- ============================================================================
-- EXPORT LOG (Append-Only)
-- ============================================================================

CREATE POLICY export_log_select ON public.export_log
  FOR SELECT
  USING (team_id = app.current_team_id());

CREATE POLICY export_log_insert ON public.export_log
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND user_id = auth.uid()
  );

-- Append-only: no updates or deletes
CREATE POLICY export_log_update ON public.export_log
  FOR UPDATE
  USING (false);

CREATE POLICY export_log_delete ON public.export_log
  FOR DELETE
  USING (false);
