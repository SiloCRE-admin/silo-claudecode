'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { LeaseCompWithBuilding, LeaseCompReminder, TeamMember } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import RemindersTab from '@/app/(app)/lease-comps/[id]/tabs/reminders-tab'
import { Bell, Loader2 } from 'lucide-react'

interface RemindersSectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  teamMembers: TeamMember[]
}

export default function RemindersSection({ comp, userId, teamId, teamMembers }: RemindersSectionProps) {
  const [reminders, setReminders] = useState<LeaseCompReminder[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (reminders !== null) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('lease_comp_reminders')
      .select('*')
      .eq('lease_comp_id', comp.id)
      .order('remind_at', { ascending: true })
    setReminders((data ?? []) as LeaseCompReminder[])
    setLoading(false)
  }

  return (
    <FormSection title="Reminders" icon={Bell} collapsible defaultOpen={false} onExpand={handleExpand}>
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {reminders && (
        <RemindersTab comp={comp} userId={userId} teamId={teamId} reminders={reminders} teamMembers={teamMembers} />
      )}
    </FormSection>
  )
}
