-- Lease comps - team-private transactional lease data
-- Supports draft/active status and soft delete
-- Creator-only visibility for drafts

CREATE TABLE public.lease_comps (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  status public.comp_status NOT NULL DEFAULT 'draft',
  tenant_name_raw text,
  tenant_name_normalized text,
  lease_sf integer,
  signed_date date,
  lease_start_date date,
  lease_end_date date,
  lease_term_months integer,
  rent_psf_cents integer,
  ti_allowance_cents integer,
  free_rent_months integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_lease_comps_team_id ON public.lease_comps(team_id);
CREATE INDEX idx_lease_comps_team_building ON public.lease_comps(team_id, building_id);
CREATE INDEX idx_lease_comps_tenant_normalized ON public.lease_comps(tenant_name_normalized) WHERE tenant_name_normalized IS NOT NULL;
CREATE INDEX idx_lease_comps_lease_end_date ON public.lease_comps(lease_end_date) WHERE lease_end_date IS NOT NULL;
CREATE INDEX idx_lease_comps_team_not_deleted ON public.lease_comps(team_id, is_deleted);

COMMENT ON TABLE public.lease_comps IS 'Team-private lease comparables - supports draft/active status and soft delete';
COMMENT ON COLUMN public.lease_comps.status IS 'draft = creator-only visibility, active = team-visible';
COMMENT ON COLUMN public.lease_comps.rent_psf_cents IS 'Rent per square foot in integer cents';
COMMENT ON COLUMN public.lease_comps.ti_allowance_cents IS 'Tenant improvement allowance in integer cents';
