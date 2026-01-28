-- Building moderation tables - flag issues, review queue, and field locking
-- Users can flag issues; God Admin reviews and can lock fields

-- Building flags - users report issues with building data
CREATE TABLE public.building_flags (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  flagged_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  field_name text NOT NULL,
  reason text NOT NULL,
  status public.flag_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_building_flags_building_id ON public.building_flags(building_id);
CREATE INDEX idx_building_flags_status ON public.building_flags(status);
CREATE INDEX idx_building_flags_flagged_by ON public.building_flags(flagged_by_user_id);

-- Admin review queue - proposed changes awaiting God Admin decision
CREATE TABLE public.admin_review_queue (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  proposed_value_json jsonb NOT NULL,
  status public.admin_review_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_review_queue_building_id ON public.admin_review_queue(building_id);
CREATE INDEX idx_admin_review_queue_status ON public.admin_review_queue(status);

-- Locked building fields - God Admin can lock fields to prevent further changes
CREATE TABLE public.locked_building_fields (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  locked_by uuid NOT NULL REFERENCES auth.users(id),
  locked_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (building_id, field_name)
);

CREATE INDEX idx_locked_fields_building_id ON public.locked_building_fields(building_id);
CREATE INDEX idx_locked_fields_active ON public.locked_building_fields(is_active) WHERE is_active = true;

COMMENT ON TABLE public.building_flags IS 'User-reported issues with building data';
COMMENT ON TABLE public.admin_review_queue IS 'Proposed building data changes awaiting God Admin review';
COMMENT ON TABLE public.locked_building_fields IS 'Fields locked by God Admin to prevent further changes';
