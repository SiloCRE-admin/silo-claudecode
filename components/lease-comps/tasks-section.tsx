'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { LeaseCompWithBuilding, LeaseCompTask, TeamMember } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import TasksTab from '@/app/(app)/lease-comps/[id]/tabs/tasks-tab'
import { CheckSquare, Loader2 } from 'lucide-react'

interface TasksSectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  teamMembers: TeamMember[]
}

export default function TasksSection({ comp, userId, teamId, teamMembers }: TasksSectionProps) {
  const [tasks, setTasks] = useState<LeaseCompTask[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (tasks !== null) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('lease_comp_tasks')
      .select('*')
      .eq('lease_comp_id', comp.id)
      .order('created_at', { ascending: false })
    setTasks((data ?? []) as LeaseCompTask[])
    setLoading(false)
  }

  return (
    <FormSection title="Tasks" icon={CheckSquare} collapsible defaultOpen={false} onExpand={handleExpand}>
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {tasks && (
        <TasksTab comp={comp} userId={userId} teamId={teamId} tasks={tasks} teamMembers={teamMembers} />
      )}
    </FormSection>
  )
}
