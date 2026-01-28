-- Entity field provenance - field-level lineage and confidence tracking
-- Tracks source and confidence for individual fields across all entities
-- Append-only for audit trail (no updates/deletes)

CREATE TABLE public.entity_field_provenance (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  source_type public.provenance_source_type NOT NULL,
  source_reference_id uuid,
  confidence_score integer CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  overridden_by_user boolean NOT NULL DEFAULT false,
  extracted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entity_prov_team_id ON public.entity_field_provenance(team_id);
CREATE INDEX idx_entity_prov_entity ON public.entity_field_provenance(team_id, entity_type, entity_id);
CREATE INDEX idx_entity_prov_source ON public.entity_field_provenance(team_id, source_type, source_reference_id);
CREATE INDEX idx_entity_prov_field ON public.entity_field_provenance(entity_type, field_name);

COMMENT ON TABLE public.entity_field_provenance IS 'Field-level lineage tracking - append-only audit trail';
COMMENT ON COLUMN public.entity_field_provenance.entity_type IS 'Entity table name (e.g., lease_comps)';
COMMENT ON COLUMN public.entity_field_provenance.entity_id IS 'Entity primary key';
COMMENT ON COLUMN public.entity_field_provenance.field_name IS 'Field name being tracked';
COMMENT ON COLUMN public.entity_field_provenance.source_reference_id IS 'Optional reference to document, extraction job, etc.';
COMMENT ON COLUMN public.entity_field_provenance.confidence_score IS 'AI confidence 0-100 (nullable)';
COMMENT ON COLUMN public.entity_field_provenance.overridden_by_user IS 'True if user manually edited after AI extraction';
