-- Lease Comp Tasks and Reminders
-- Tasks: priority-based work items with no date requirement
-- Reminders: datetime-based notifications (in-app + email)
--
-- Both use hard delete (lightweight action items, not archival records).
-- RLS inherits confidentiality from parent lease_comp via EXISTS subquery.

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE public.lease_comp_tasks (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),

  title           text NOT NULL,
  assigned_to     uuid NOT NULL REFERENCES auth.users(id),
  priority        public.comp_task_priority NOT NULL,
  status          public.comp_task_status NOT NULL DEFAULT 'open',
  notes           text,
  completed_at    timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.lease_comp_tasks IS 'Priority-based work items tied to a lease comp';

CREATE INDEX idx_comp_tasks_comp ON public.lease_comp_tasks(lease_comp_id);
CREATE INDEX idx_comp_tasks_team ON public.lease_comp_tasks(team_id);
CREATE INDEX idx_comp_tasks_assigned ON public.lease_comp_tasks(assigned_to, status);

ALTER TABLE public.lease_comp_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY comp_tasks_select ON public.lease_comp_tasks
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_tasks_insert ON public.lease_comp_tasks
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_tasks_update ON public.lease_comp_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_tasks_delete ON public.lease_comp_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

-- ============================================================================
-- REMINDERS
-- ============================================================================

CREATE TABLE public.lease_comp_reminders (
  id              uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  lease_comp_id   uuid NOT NULL REFERENCES public.lease_comps(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES public.teams(id),

  title             text NOT NULL,
  assigned_to       uuid NOT NULL REFERENCES auth.users(id),
  remind_at         timestamptz NOT NULL,
  notes             text,
  completed_at      timestamptz,
  notification_sent boolean NOT NULL DEFAULT false,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  updated_by  uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.lease_comp_reminders IS 'Datetime-based notifications tied to a lease comp (in-app + email)';
COMMENT ON COLUMN public.lease_comp_reminders.notification_sent IS 'Set true after delivery to prevent duplicate notifications';

CREATE INDEX idx_comp_reminders_comp ON public.lease_comp_reminders(lease_comp_id);
CREATE INDEX idx_comp_reminders_team ON public.lease_comp_reminders(team_id);
CREATE INDEX idx_comp_reminders_pending ON public.lease_comp_reminders(remind_at)
  WHERE notification_sent = false AND completed_at IS NULL;

ALTER TABLE public.lease_comp_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY comp_reminders_select ON public.lease_comp_reminders
  FOR SELECT
  USING (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_reminders_insert ON public.lease_comp_reminders
  FOR INSERT
  WITH CHECK (
    team_id = app.current_team_id()
    AND EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_reminders_update ON public.lease_comp_reminders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );

CREATE POLICY comp_reminders_delete ON public.lease_comp_reminders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lease_comps lc
      WHERE lc.id = lease_comp_id
    )
  );
