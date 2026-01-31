-- Lease Comp History: immutable event timeline with field-level diffs
--
-- Events are created by the application layer (not triggers) to exclude
-- autosave noise and derived recalculations per spec section 3.11.3.
--
-- Both tables are append-only: no UPDATE or DELETE allowed.

-- ============================================================================
-- EVENTS (high-level timeline)
-- ============================================================================

CREATE TABLE public.lease_comp_events (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),
  event_type      public.comp_event_type NOT NULL,
  summary         text NOT NULL,
  actor_user_id   uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lease_comp_events IS 'Immutable chronological event timeline per lease comp';

CREATE INDEX idx_comp_events_comp ON public.lease_comp_events(lease_comp_id, created_at);
CREATE INDEX idx_comp_events_team ON public.lease_comp_events(team_id);

ALTER TABLE public.lease_comp_events ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit visibility from parent lease_comp
CREATE POLICY comp_events_select ON public.lease_comp_events
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- INSERT: team member who can see the comp
CREATE POLICY comp_events_insert ON public.lease_comp_events
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- Append-only: no updates
CREATE POLICY comp_events_update ON public.lease_comp_events
  FOR UPDATE
  USING (false);

-- Append-only: no deletes
CREATE POLICY comp_events_delete ON public.lease_comp_events
  FOR DELETE
  USING (false);

-- ============================================================================
-- EVENT DIFFS (field-level change detail, expandable per event)
-- ============================================================================

CREATE TABLE public.lease_comp_event_diffs (
  id          uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  event_id    uuid NOT NULL REFERENCES public.lease_comp_events(id) ON DELETE CASCADE,
  field_label text NOT NULL,
  old_value   text,
  new_value   text
);

COMMENT ON TABLE public.lease_comp_event_diffs IS 'Field-level diffs per comp history event (expandable detail)';

CREATE INDEX idx_comp_event_diffs_event ON public.lease_comp_event_diffs(event_id);

ALTER TABLE public.lease_comp_event_diffs ENABLE ROW LEVEL SECURITY;

-- SELECT: inherit visibility from parent event (which inherits from comp)
CREATE POLICY comp_event_diffs_select ON public.lease_comp_event_diffs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comp_events e
      WHERE e.id = event_id
    )
  );

-- INSERT: allowed if event is accessible
CREATE POLICY comp_event_diffs_insert ON public.lease_comp_event_diffs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lease_comp_events e
      WHERE e.id = event_id
    )
  );

-- Append-only: no updates
CREATE POLICY comp_event_diffs_update ON public.lease_comp_event_diffs
  FOR UPDATE
  USING (false);

-- Append-only: no deletes
CREATE POLICY comp_event_diffs_delete ON public.lease_comp_event_diffs
  FOR DELETE
  USING (false);
