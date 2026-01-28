-- Building attribute provenance - tracks source and confidence for building attributes
-- Links to building_attributes to record where data came from (user, AI, import, etc.)

CREATE TABLE public.building_attribute_provenance (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  building_attribute_id uuid NOT NULL REFERENCES public.building_attributes(id) ON DELETE CASCADE,
  source_type public.building_attribute_source NOT NULL,
  source_reference_id uuid,
  confidence_score integer CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_building_attr_prov_attr_id ON public.building_attribute_provenance(building_attribute_id);
CREATE INDEX idx_building_attr_prov_source ON public.building_attribute_provenance(source_type, source_reference_id);

COMMENT ON TABLE public.building_attribute_provenance IS 'Provenance tracking for building attributes (source, confidence)';
COMMENT ON COLUMN public.building_attribute_provenance.source_reference_id IS 'Optional reference to source document, extraction job, etc.';
COMMENT ON COLUMN public.building_attribute_provenance.confidence_score IS 'Optional confidence score 0-100';
