-- Create all enum types for Silo database
-- Enums enforce type safety at the database level and reduce storage overhead

-- Identity & Roles
CREATE TYPE public.user_role AS ENUM (
  'team_owner',
  'team_admin',
  'team_member',
  'billing_contact'
);

-- Building Layer
CREATE TYPE public.coordinate_source AS ENUM (
  'admin',
  'user',
  'google'
);

CREATE TYPE public.building_attribute_source AS ENUM (
  'admin',
  'user',
  'ai',
  'import'
);

CREATE TYPE public.flag_status AS ENUM (
  'open',
  'resolved',
  'rejected'
);

CREATE TYPE public.admin_review_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Comps & Development
CREATE TYPE public.comp_status AS ENUM (
  'draft',
  'active'
);

CREATE TYPE public.development_status AS ENUM (
  'planned',
  'under_construction',
  'delivering',
  'delivered',
  'stalled',
  'cancelled'
);

-- Market Chatter
CREATE TYPE public.chatter_category AS ENUM (
  'lease',
  'sale',
  'development',
  'tenant_movement',
  'debt',
  'ownership_change',
  'distress',
  'capital_markets',
  'other'
);

-- Asset Management
CREATE TYPE public.suite_status AS ENUM (
  'occupied_stable',
  'occupied_known_vacate',
  'occupied_renewal_likely',
  'occupied_renewal_unlikely',
  'occupied_renewal_pending',
  'occupied_renewal_unknown',
  'vacant_available',
  'vacant_signed_loi',
  'vacant_leased_not_commenced',
  'other_off_market'
);

-- Guest Access
CREATE TYPE public.guest_permission AS ENUM (
  'owner',
  'broker',
  'property_manager'
);

-- Documents
CREATE TYPE public.document_capture_source AS ENUM (
  'upload',
  'email',
  'bulk_import',
  'voice',
  'photo_ocr'
);

CREATE TYPE public.document_status AS ENUM (
  'active',
  'processing',
  'failed'
);

-- Extraction
CREATE TYPE public.extraction_job_type AS ENUM (
  'single_document',
  'bulk_batch',
  'email_ingest',
  'voice',
  'ocr'
);

CREATE TYPE public.extraction_job_status AS ENUM (
  'queued',
  'running',
  'needs_review',
  'committed',
  'failed',
  'cancelled'
);

CREATE TYPE public.extraction_item_status AS ENUM (
  'draft',
  'accepted',
  'rejected'
);

-- Provenance
CREATE TYPE public.provenance_source_type AS ENUM (
  'user',
  'ai',
  'import',
  'document',
  'system'
);

-- Audit
CREATE TYPE public.audit_action AS ENUM (
  'insert',
  'update',
  'delete',
  'restore',
  'export'
);
