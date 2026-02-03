/**
 * TypeScript types for the Lease Comp system
 *
 * Mirrors DB schema from migrations 015, 042–046, 051.
 * All enum unions match Postgres enum values exactly.
 */

// ============================================================================
// Enums (match Postgres enum values)
// ============================================================================

export type CompStatus = 'draft' | 'active'

// Lease Details enums (Postgres enums from migrations 051 + 052)
export type LeaseType = 'new' | 'renewal' | 'expansion' | 'sublease'
export type LeaseStatus = 'signed' | 'pending' | 'proposal'
export type LeaseSfType = 'single_story' | 'rba_incl_2nd_fl'
export type OfficeSfLeaseType = 'single_story' | 'multi_story'
export type Confidence = 'confirmed' | 'estimated'
export type RateUnits = 'sf_yr' | 'sf_mo' | 'mo' | 'yr' | 'ac_mo' | 'lsf_yr' | 'lsf_mo'
export type ReimbursementMethod = 'net' | 'gross' | 'modified_gross' | 'base_year' | 'other'
export type EscalationUnits = 'pct' | 'sf' | 'mo'
export type FreeRentUnits = 'mos' | 'amount'
export type TiUnits = 'sf' | 'amount'

export type InternalAccessLevel = 'all_team' | 'owner_admin_me' | 'owner_me' | 'just_me'
export type ExportDetailLevel = 'all_visible' | 'hide_major_terms' | 'hide_all' | 'excluded'

export type ExerciseWindowType = 'by_deadline' | 'between_dates' | 'rolling'
export type RollingTriggerType = 'lease_start' | 'lease_end' | 'fixed_date'
export type NoticeMethod = 'days_prior' | 'fixed_date'

export type RenewalRateBasis = 'fmv' | 'pct_fmv' | 'fixed_rate' | 'cpi_adjustment'
export type FloorCapType = 'pct_prior_rent' | 'fixed_sf' | 'other'
export type CpiFrequency = 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'other'

export type TerminationOptionType = 'one_time' | 'ongoing'

export type ExpansionOptionType = 'rofo' | 'rofr' | 'fixed_expansion' | 'must_take'
export type ExpansionTiming = 'ongoing' | 'date_specific'
export type ExpansionRateBasis = 'fmv' | 'same_terms' | 'fixed_rate' | 'pre_agreed'

export type PurchaseStructure = 'fixed_date' | 'rofr'
export type PurchasePriceBasis = 'fixed_price' | 'fmv' | 'formula_based'

export type CompTaskPriority = 'high' | 'medium' | 'low'
export type CompTaskStatus = 'open' | 'completed'

export type CompEventType =
  | 'comp_created'
  | 'comp_duplicated'
  | 'status_changed'
  | 'confidentiality_changed'
  | 'export_level_changed'
  | 'option_added'
  | 'option_edited'
  | 'option_removed'
  | 'file_added'
  | 'file_removed'
  | 'task_created'
  | 'task_completed'
  | 'reminder_created'
  | 'reminder_completed'
  | 'fields_edited'

// ============================================================================
// Lease Comp (main record)
// ============================================================================

export interface LeaseComp {
  id: string
  team_id: string
  building_id: string
  status: CompStatus
  tenant_name_raw: string | null
  tenant_name_normalized: string | null
  lease_sf: number | null
  signed_date: string | null
  lease_start_date: string | null
  lease_end_date: string | null
  lease_term_months: number | null
  rent_psf_cents: number | null
  ti_allowance_cents: number | null
  free_rent_months: number | null
  internal_access_level: InternalAccessLevel
  export_detail_level: ExportDetailLevel
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  is_deleted: boolean
  deleted_at: string | null
  // Lease Details (migration 051)
  lease_type: LeaseType | null
  lease_status: LeaseStatus | null
  lease_sf_type: LeaseSfType | null
  lease_sf_confidence: Confidence | null
  office_sf_lease: number | null
  office_pct_lease: number | null
  office_sf_lease_type: OfficeSfLeaseType | null
  office_sf_lease_confidence: Confidence | null
  signed_date_confidence: Confidence | null
  lease_start_date_confidence: Confidence | null
  lease_term_months_confidence: Confidence | null
  lease_end_date_confidence: Confidence | null
  starting_rate_units: RateUnits | null
  starting_rate_confidence: Confidence | null
  reimbursement_method: ReimbursementMethod | null
  opex_cents: number | null
  opex_units: RateUnits | null
  opex_confidence: Confidence | null
  escalation_value: number | null
  escalation_units: EscalationUnits | null
  escalation_frequency_months: number | null
  escalation_confidence: Confidence | null
  free_rent_amount_cents: number | null
  free_rent_units: FreeRentUnits | null
  free_rent_confidence: Confidence | null
  ti_units: TiUnits | null
  ti_confidence: Confidence | null
  presentation_comments_external: string | null
  presentation_comments_internal: string | null
  misc_commentary: string | null
  // Optional — column added when migration 058 is applied
  reimbursement_other_notes?: string | null
}

/** Lease comp with joined building info, used in list and detail views */
export interface LeaseCompWithBuilding extends LeaseComp {
  building_name: string | null
  building_address: string | null
  building_city: string | null
  building_state: string | null
  building_latitude: number | null
  building_longitude: number | null
  building_clear_height: number | null
}

// ============================================================================
// Options
// ============================================================================

export interface RenewalOption {
  id: string
  lease_comp_id: string
  team_id: string
  option_number: number
  exercise_window_type: ExerciseWindowType | null
  exercise_deadline: string | null
  window_start_date: string | null
  window_end_date: string | null
  rolling_trigger_type: RollingTriggerType | null
  rolling_trigger_months: number | null
  rolling_trigger_date: string | null
  notice_method: NoticeMethod | null
  notice_days_prior: number | null
  notice_fixed_date: string | null
  renewal_term_months: number | null
  rate_basis: RenewalRateBasis | null
  pct_of_fmv: number | null
  floor_type: FloorCapType | null
  floor_value: number | null
  floor_override_text: string | null
  cap_type: FloorCapType | null
  cap_value: number | null
  cap_override_text: string | null
  cpi_index: string | null
  cpi_frequency: CpiFrequency | null
  cpi_min: string | null
  cpi_max: string | null
  commentary: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface TerminationOption {
  id: string
  lease_comp_id: string
  team_id: string
  option_number: number
  type: TerminationOptionType | null
  exercise_window_type: ExerciseWindowType | null
  exercise_deadline: string | null
  window_start_date: string | null
  window_end_date: string | null
  rolling_trigger_type: RollingTriggerType | null
  rolling_trigger_months: number | null
  rolling_trigger_date: string | null
  notice_method: NoticeMethod | null
  notice_days_prior: number | null
  notice_fixed_date: string | null
  termination_fee_cents: number | null
  commentary: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ExpansionOption {
  id: string
  lease_comp_id: string
  team_id: string
  option_number: number
  type: ExpansionOptionType | null
  subject_suite: string | null
  decision_window_days: number | null
  timing: ExpansionTiming | null
  timing_date: string | null
  rate_basis: ExpansionRateBasis | null
  commentary: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface PurchaseOption {
  id: string
  lease_comp_id: string
  team_id: string
  option_number: number
  structure: PurchaseStructure | null
  exercise_window_type: ExerciseWindowType | null
  exercise_deadline: string | null
  window_start_date: string | null
  window_end_date: string | null
  rolling_trigger_type: RollingTriggerType | null
  rolling_trigger_months: number | null
  rolling_trigger_date: string | null
  notice_method: NoticeMethod | null
  notice_days_prior: number | null
  notice_fixed_date: string | null
  price_basis: PurchasePriceBasis | null
  purchase_price_cents: number | null
  pricing_formula: string | null
  commentary: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ============================================================================
// Tasks & Reminders
// ============================================================================

export interface LeaseCompTask {
  id: string
  lease_comp_id: string
  team_id: string
  title: string
  assigned_to: string
  priority: CompTaskPriority
  status: CompTaskStatus
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface LeaseCompReminder {
  id: string
  lease_comp_id: string
  team_id: string
  title: string
  assigned_to: string
  remind_at: string
  notes: string | null
  completed_at: string | null
  notification_sent: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ============================================================================
// Files
// ============================================================================

export interface LeaseCompFile {
  id: string
  lease_comp_id: string
  team_id: string
  storage_path: string
  original_filename: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
  created_by: string
}

// ============================================================================
// Comp History (events + diffs)
// ============================================================================

export interface LeaseCompEvent {
  id: string
  lease_comp_id: string
  team_id: string
  event_type: CompEventType
  summary: string
  actor_user_id: string
  created_at: string
}

/** Input shape for the log_lease_comp_event_with_diffs RPC (no id/event_id). */
export interface CompEventDiffInput {
  field_label: string
  old_value: string | null
  new_value: string | null
}

export interface LeaseCompEventDiff extends CompEventDiffInput {
  id: string
  event_id: string
}

export interface LeaseCompEventWithDiffs extends LeaseCompEvent {
  diffs: LeaseCompEventDiff[]
}

// ============================================================================
// Team member (for assignment dropdowns)
// ============================================================================

export interface TeamMember {
  user_id: string
  email: string
  role: string
}
