-- Audit log - append-only audit trail for all team data changes
-- Tracks insert/update/delete/restore/export actions
-- No updates or deletes allowed on audit_log itself

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action public.audit_action NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_team_id ON public.audit_log(team_id);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Export log - tracks data exports for compliance and governance
-- Append-only for export tracking
CREATE TABLE public.export_log (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  export_type text NOT NULL,
  record_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_log_team_id ON public.export_log(team_id);
CREATE INDEX idx_export_log_user_id ON public.export_log(user_id);
CREATE INDEX idx_export_log_created_at ON public.export_log(created_at DESC);

COMMENT ON TABLE public.audit_log IS 'Append-only audit trail - all team data changes (no updates/deletes on this table)';
COMMENT ON COLUMN public.audit_log.table_name IS 'Table where change occurred';
COMMENT ON COLUMN public.audit_log.record_id IS 'Primary key of affected record';
COMMENT ON COLUMN public.audit_log.old_value IS 'Record state before change (JSONB)';
COMMENT ON COLUMN public.audit_log.new_value IS 'Record state after change (JSONB)';

COMMENT ON TABLE public.export_log IS 'Data export tracking for compliance and governance';
COMMENT ON COLUMN public.export_log.export_type IS 'Export format (pdf, excel, csv, link, etc.)';
