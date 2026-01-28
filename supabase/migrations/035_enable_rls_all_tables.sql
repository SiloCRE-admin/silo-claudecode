-- Enable Row Level Security on all tables
-- FORCE ensures RLS applies even to table owners (critical for security)
-- All tables except auth.* (managed by Supabase)

-- Identity & Tenancy
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams FORCE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Reference Data
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.submarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submarkets FORCE ROW LEVEL SECURITY;

-- Buildings Layer
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.building_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_attributes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.building_attribute_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_attribute_provenance FORCE ROW LEVEL SECURITY;

ALTER TABLE public.building_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_flags FORCE ROW LEVEL SECURITY;

ALTER TABLE public.admin_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_review_queue FORCE ROW LEVEL SECURITY;

ALTER TABLE public.locked_building_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_building_fields FORCE ROW LEVEL SECURITY;

ALTER TABLE public.team_building_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_building_presence FORCE ROW LEVEL SECURITY;

-- Comps
ALTER TABLE public.lease_comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_comps FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sale_comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_comps FORCE ROW LEVEL SECURITY;

ALTER TABLE public.land_comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_comps FORCE ROW LEVEL SECURITY;

-- Developments
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developments FORCE ROW LEVEL SECURITY;

-- Market Chatter
ALTER TABLE public.market_chatter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter FORCE ROW LEVEL SECURITY;

ALTER TABLE public.market_chatter_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter_flags FORCE ROW LEVEL SECURITY;

ALTER TABLE public.market_chatter_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter_buildings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.market_chatter_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter_contacts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.market_chatter_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter_markets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.market_chatter_submarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_chatter_submarkets FORCE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;

-- Asset Management
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios FORCE ROW LEVEL SECURITY;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suites FORCE ROW LEVEL SECURITY;

ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies FORCE ROW LEVEL SECURITY;

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects FORCE ROW LEVEL SECURITY;

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lois FORCE ROW LEVEL SECURITY;

ALTER TABLE public.suite_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suite_budgets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.make_ready_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.make_ready_projects FORCE ROW LEVEL SECURITY;

-- Guest Access
ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.guest_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_access FORCE ROW LEVEL SECURITY;

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links FORCE ROW LEVEL SECURITY;

-- Extraction
ALTER TABLE public.extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.extraction_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_job_items FORCE ROW LEVEL SECURITY;

-- Provenance & Audit
ALTER TABLE public.entity_field_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_field_provenance FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

ALTER TABLE public.export_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_log FORCE ROW LEVEL SECURITY;
