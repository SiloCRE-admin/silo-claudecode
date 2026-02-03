'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { LeaseCompWithBuilding, LeaseCompEventWithDiffs } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import HistoryTab from '@/app/(app)/lease-comps/[id]/tabs/history-tab'
import { Clock, Loader2 } from 'lucide-react'

interface HistorySectionProps {
  comp: LeaseCompWithBuilding
}

export default function HistorySection({ comp }: HistorySectionProps) {
  const [events, setEvents] = useState<LeaseCompEventWithDiffs[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (events !== null) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch events
    const { data: eventsData } = await supabase
      .from('lease_comp_events')
      .select('*')
      .eq('lease_comp_id', comp.id)
      .order('created_at', { ascending: false })

    if (!eventsData || eventsData.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }

    // Fetch diffs for all events
    const eventIds = eventsData.map((e) => e.id)
    const { data: diffsData } = await supabase
      .from('lease_comp_event_diffs')
      .select('*')
      .in('event_id', eventIds)

    // Group diffs by event_id
    const diffsByEvent = new Map<string, typeof diffsData>()
    for (const diff of diffsData ?? []) {
      const existing = diffsByEvent.get(diff.event_id) ?? []
      existing.push(diff)
      diffsByEvent.set(diff.event_id, existing)
    }

    const eventsWithDiffs: LeaseCompEventWithDiffs[] = eventsData.map((event) => ({
      ...event,
      diffs: (diffsByEvent.get(event.id) ?? []) as LeaseCompEventWithDiffs['diffs'],
    }))

    setEvents(eventsWithDiffs)
    setLoading(false)
  }

  return (
    <FormSection title="Comp History" icon={Clock} collapsible defaultOpen={false} onExpand={handleExpand}>
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {events && <HistoryTab events={events} />}
    </FormSection>
  )
}
