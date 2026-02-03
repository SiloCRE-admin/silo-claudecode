/**
 * Client-side helper for atomic lease comp history logging.
 *
 * All event + diff writes MUST go through this helper (enforced by
 * scripts/lint-history-tables.js). The underlying Postgres function
 * public.log_lease_comp_event_with_diffs() inserts the event and diffs
 * in a single transaction with caller identity and diff shape validation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompEventType, CompEventDiffInput } from '@/lib/types/lease-comps'

export interface LogLeaseCompEventParams {
  leaseCompId: string
  teamId: string
  eventType: CompEventType
  summary: string
  actorUserId: string
  diffs?: CompEventDiffInput[]
}

/**
 * Atomically log a lease comp event with optional field-level diffs.
 *
 * Throws on failure — callers that want non-blocking logging should
 * wrap the call in their own try/catch.
 */
export async function logLeaseCompEvent(
  supabase: SupabaseClient,
  params: LogLeaseCompEventParams
): Promise<void> {
  const { error } = await supabase.rpc('log_lease_comp_event_with_diffs', {
    p_lease_comp_id: params.leaseCompId,
    p_team_id: params.teamId,
    p_event_type: params.eventType,
    p_summary: params.summary,
    p_actor_user_id: params.actorUserId,
    ...(params.diffs && params.diffs.length > 0 ? { p_diffs: params.diffs } : {}),
  })
  if (error) throw new Error(`Failed to log event: ${error.message}`)
}
