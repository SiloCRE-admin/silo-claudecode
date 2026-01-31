-- Enums for Lease Comp subsystems
-- Covers: Options, Confidentiality, Tasks, Reminders, Comp History
--
-- These enums are used by tables in migrations 043–046.

-- ============================================================================
-- CONFIDENTIALITY
-- ============================================================================

CREATE TYPE public.internal_access_level AS ENUM (
  'all_team',
  'owner_admin_me',
  'owner_me',
  'just_me'
);

CREATE TYPE public.export_detail_level AS ENUM (
  'all_visible',
  'hide_major_terms',
  'hide_all',
  'excluded'
);

-- ============================================================================
-- OPTIONS: SHARED ENUMS
-- ============================================================================

CREATE TYPE public.exercise_window_type AS ENUM (
  'by_deadline',
  'between_dates',
  'rolling'
);

CREATE TYPE public.rolling_trigger_type AS ENUM (
  'lease_start',
  'lease_end',
  'fixed_date'
);

CREATE TYPE public.notice_method AS ENUM (
  'days_prior',
  'fixed_date'
);

-- ============================================================================
-- OPTIONS: RENEWAL
-- ============================================================================

CREATE TYPE public.renewal_rate_basis AS ENUM (
  'fmv',
  'pct_fmv',
  'fixed_rate',
  'cpi_adjustment'
);

CREATE TYPE public.floor_cap_type AS ENUM (
  'pct_prior_rent',
  'fixed_sf',
  'other'
);

CREATE TYPE public.cpi_frequency AS ENUM (
  'annual',
  'semi_annual',
  'quarterly',
  'monthly',
  'other'
);

-- ============================================================================
-- OPTIONS: TERMINATION
-- ============================================================================

CREATE TYPE public.termination_option_type AS ENUM (
  'one_time',
  'ongoing'
);

-- ============================================================================
-- OPTIONS: EXPANSION / ROFR
-- ============================================================================

CREATE TYPE public.expansion_option_type AS ENUM (
  'rofo',
  'rofr',
  'fixed_expansion',
  'must_take'
);

CREATE TYPE public.expansion_timing AS ENUM (
  'ongoing',
  'date_specific'
);

CREATE TYPE public.expansion_rate_basis AS ENUM (
  'fmv',
  'same_terms',
  'fixed_rate',
  'pre_agreed'
);

-- ============================================================================
-- OPTIONS: PURCHASE
-- ============================================================================

CREATE TYPE public.purchase_structure AS ENUM (
  'fixed_date',
  'rofr'
);

CREATE TYPE public.purchase_price_basis AS ENUM (
  'fixed_price',
  'fmv',
  'formula_based'
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TYPE public.comp_task_priority AS ENUM (
  'high',
  'medium',
  'low'
);

CREATE TYPE public.comp_task_status AS ENUM (
  'open',
  'completed'
);

-- ============================================================================
-- COMP HISTORY
-- ============================================================================

CREATE TYPE public.comp_event_type AS ENUM (
  'comp_created',
  'comp_duplicated',
  'status_changed',
  'confidentiality_changed',
  'export_level_changed',
  'option_added',
  'option_edited',
  'option_removed',
  'file_added',
  'file_removed',
  'task_created',
  'task_completed',
  'reminder_created',
  'reminder_completed',
  'fields_edited'
);
