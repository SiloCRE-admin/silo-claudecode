/**
 * Server-side lease comp API helpers
 * RLS-safe queries using createServerClient
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type {
  LeaseCompWithBuilding,
  RenewalOption,
  TerminationOption,
  ExpansionOption,
  PurchaseOption,
  LeaseCompTask,
  LeaseCompReminder,
  LeaseCompFile,
  LeaseCompEventWithDiffs,
  TeamMember,
} from '@/lib/types/lease-comps'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * List all lease comps for the current team (not deleted)
 * RLS enforces team_id + confidentiality filtering
 */
export async function getTeamLeaseComps(): Promise<LeaseCompWithBuilding[]> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('lease_comps')
    .select(`
      *,
      buildings!inner (
        name,
        full_address_raw
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lease comps:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map(row => {
    const building = row.buildings as unknown as {
      name: string | null
      full_address_raw: string | null
    } | null

    return {
      ...row,
      buildings: undefined,
      building_name: building?.name || null,
      building_address: building?.full_address_raw || null,
    } as LeaseCompWithBuilding
  })
}

/**
 * Get a single lease comp by ID with building info
 * RLS enforces team_id + confidentiality + soft delete
 */
export async function getLeaseCompDetail(id: string): Promise<LeaseCompWithBuilding | null> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('lease_comps')
    .select(`
      *,
      buildings!inner (
        name,
        full_address_raw,
        city,
        state,
        latitude,
        longitude,
        clear_height
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  const building = data.buildings as unknown as {
    name: string | null
    full_address_raw: string | null
    city: string | null
    state: string | null
    latitude: number | null
    longitude: number | null
    clear_height: number | null
  } | null

  return {
    ...data,
    buildings: undefined,
    building_name: building?.name || null,
    building_address: building?.full_address_raw || null,
    building_city: building?.city || null,
    building_state: building?.state || null,
    building_latitude: building?.latitude || null,
    building_longitude: building?.longitude || null,
    building_clear_height: building?.clear_height || null,
  } as LeaseCompWithBuilding
}

// ============================================================================
// Options
// ============================================================================

export async function getRenewalOptions(leaseCompId: string): Promise<RenewalOption[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_renewal_options')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('option_number', { ascending: true })

  if (error) {
    console.error('Error fetching renewal options:', error)
    return []
  }
  return (data || []) as RenewalOption[]
}

export async function getTerminationOptions(leaseCompId: string): Promise<TerminationOption[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_termination_options')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('option_number', { ascending: true })

  if (error) {
    console.error('Error fetching termination options:', error)
    return []
  }
  return (data || []) as TerminationOption[]
}

export async function getExpansionOptions(leaseCompId: string): Promise<ExpansionOption[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_expansion_options')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('option_number', { ascending: true })

  if (error) {
    console.error('Error fetching expansion options:', error)
    return []
  }
  return (data || []) as ExpansionOption[]
}

export async function getPurchaseOptions(leaseCompId: string): Promise<PurchaseOption[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_purchase_options')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('option_number', { ascending: true })

  if (error) {
    console.error('Error fetching purchase options:', error)
    return []
  }
  return (data || []) as PurchaseOption[]
}

// ============================================================================
// Tasks & Reminders
// ============================================================================

export async function getLeaseCompTasks(leaseCompId: string): Promise<LeaseCompTask[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_tasks')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  return (data || []) as LeaseCompTask[]
}

export async function getLeaseCompReminders(leaseCompId: string): Promise<LeaseCompReminder[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_reminders')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('remind_at', { ascending: true })

  if (error) {
    console.error('Error fetching reminders:', error)
    return []
  }
  return (data || []) as LeaseCompReminder[]
}

// ============================================================================
// Files
// ============================================================================

export async function getLeaseCompFiles(leaseCompId: string): Promise<LeaseCompFile[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('lease_comp_files')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching files:', error)
    return []
  }
  return (data || []) as LeaseCompFile[]
}

// ============================================================================
// History (events + diffs)
// ============================================================================

export async function getLeaseCompEvents(leaseCompId: string): Promise<LeaseCompEventWithDiffs[]> {
  const supabase = await getSupabase()

  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from('lease_comp_events')
    .select('*')
    .eq('lease_comp_id', leaseCompId)
    .order('created_at', { ascending: false })

  if (eventsError || !events || events.length === 0) {
    if (eventsError) console.error('Error fetching events:', eventsError)
    return []
  }

  // Fetch all diffs for these events in one query
  const eventIds = events.map(e => e.id)
  const { data: diffs } = await supabase
    .from('lease_comp_event_diffs')
    .select('*')
    .in('event_id', eventIds)

  // Group diffs by event_id
  const diffsByEvent = new Map<string, typeof diffs>()
  if (diffs) {
    for (const diff of diffs) {
      const existing = diffsByEvent.get(diff.event_id) || []
      existing.push(diff)
      diffsByEvent.set(diff.event_id, existing)
    }
  }

  return events.map(event => ({
    ...event,
    diffs: (diffsByEvent.get(event.id) || []) as LeaseCompEventWithDiffs['diffs'],
  })) as LeaseCompEventWithDiffs[]
}

// ============================================================================
// Team members (for assignment dropdowns)
// ============================================================================

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role')

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }
  return (data || []) as TeamMember[]
}
