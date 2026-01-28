-- Building attributes table - stores current value for each building field
-- One row per (building_id, field_name) - represents the accepted/current value
-- Provenance tracked separately in building_attribute_provenance

CREATE TABLE public.building_attributes (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  value_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  -- Enforce one current value per building field
  UNIQUE (building_id, field_name)
);

CREATE INDEX idx_building_attributes_building_id ON public.building_attributes(building_id);
CREATE INDEX idx_building_attributes_field_name ON public.building_attributes(field_name);

COMMENT ON TABLE public.building_attributes IS 'Current/accepted value per building field - crowdsourced data layer';
COMMENT ON COLUMN public.building_attributes.field_name IS 'Field name (e.g., clear_height, building_sf)';
COMMENT ON COLUMN public.building_attributes.value_json IS 'Typed value stored as JSONB';
COMMENT ON CONSTRAINT building_attributes_building_id_field_name_key ON public.building_attributes IS 'Enforce single current value per field';
