'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  LeaseCompWithBuilding,
  LeaseCompTask,
  CompTaskPriority,
  TeamMember,
} from '@/lib/types/lease-comps'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

const PRIORITIES: { value: CompTaskPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

interface TasksTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  tasks: LeaseCompTask[]
  teamMembers: TeamMember[]
}

export default function TasksTab({ comp, userId, teamId, tasks, teamMembers }: TasksTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState(userId)
  const [priority, setPriority] = useState<CompTaskPriority>('medium')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    try {
      const { error: taskError } = await supabase
        .from('lease_comp_tasks')
        .insert({
          lease_comp_id: comp.id,
          team_id: teamId,
          title: title.trim(),
          assigned_to: assignedTo,
          priority,
          status: 'open',
          notes: notes.trim() || null,
          created_by: userId,
          updated_by: userId,
        })
        .select('id')
        .single()

      if (taskError) throw new Error(taskError.message)

      // Log event atomically
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id, teamId,
        eventType: 'task_created',
        summary: `Task created: "${title.trim()}"`,
        actorUserId: userId,
        diffs: [
          { field_label: 'Title', old_value: null, new_value: title.trim() },
          { field_label: 'Priority', old_value: null, new_value: priority },
        ],
      })

      setTitle('')
      setNotes('')
      setPriority('medium')
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (task: LeaseCompTask) => {
    try {
      const { error: updateError } = await supabase
        .from('lease_comp_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', task.id)

      if (updateError) throw new Error(updateError.message)

      // Log event atomically
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id, teamId,
        eventType: 'task_completed',
        summary: `Task completed: "${task.title}"`,
        actorUserId: userId,
        diffs: [{ field_label: 'Status', old_value: 'open', new_value: 'completed' }],
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task')
    }
  }

  const openTasks = tasks.filter(t => t.status === 'open')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Task
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="mt-4 rounded-md border border-gray-200 p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="taskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task description"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="taskAssignee" className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  id="taskAssignee"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {teamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  id="taskPriority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CompTaskPriority)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="taskNotes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                id="taskNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !title.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open tasks */}
      {openTasks.length > 0 && (
        <div className="mt-4 space-y-2">
          {openTasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{task.title}</span>
                  <span className={
                    task.priority === 'high' ? 'rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800'
                    : task.priority === 'medium' ? 'rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800'
                    : 'rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700'
                  }>
                    {task.priority}
                  </span>
                </div>
                {task.notes && <p className="mt-1 text-sm text-gray-600">{task.notes}</p>}
              </div>
              <button
                onClick={() => handleComplete(task)}
                className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-green-50 hover:text-green-700"
              >
                Complete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500">Completed ({completedTasks.length})</h3>
          <div className="mt-2 space-y-2">
            {completedTasks.map((task) => (
              <div key={task.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <span className="text-sm text-gray-500 line-through">{task.title}</span>
                {task.completed_at && (
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(task.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-gray-500">No tasks yet.</p>
      )}
    </div>
  )
}
