'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { LeaseCompWithBuilding, LeaseCompReminder, TeamMember } from '@/lib/types/lease-comps'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

interface RemindersTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  reminders: LeaseCompReminder[]
  teamMembers: TeamMember[]
}

export default function RemindersTab({ comp, userId, teamId, reminders, teamMembers }: RemindersTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState(userId)
  const [remindAt, setRemindAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleAdd = async () => {
    if (!title.trim() || !remindAt) return
    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('lease_comp_reminders')
        .insert({
          lease_comp_id: comp.id,
          team_id: teamId,
          title: title.trim(),
          assigned_to: assignedTo,
          remind_at: new Date(remindAt).toISOString(),
          notes: notes.trim() || null,
          created_by: userId,
          updated_by: userId,
        })

      if (insertError) throw new Error(insertError.message)

      // Log event atomically
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id, teamId,
        eventType: 'reminder_created',
        summary: `Reminder created: "${title.trim()}" for ${new Date(remindAt).toLocaleDateString()}`,
        actorUserId: userId,
        diffs: [
          { field_label: 'Title', old_value: null, new_value: title.trim() },
          { field_label: 'Remind At', old_value: null, new_value: new Date(remindAt).toISOString() },
        ],
      })

      setTitle('')
      setRemindAt('')
      setNotes('')
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (reminder: LeaseCompReminder) => {
    try {
      const { error: updateError } = await supabase
        .from('lease_comp_reminders')
        .update({
          completed_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', reminder.id)

      if (updateError) throw new Error(updateError.message)

      // Log event atomically
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id, teamId,
        eventType: 'reminder_completed',
        summary: `Reminder completed: "${reminder.title}"`,
        actorUserId: userId,
        diffs: [{ field_label: 'Status', old_value: 'pending', new_value: 'completed' }],
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete reminder')
    }
  }

  const pendingReminders = reminders.filter(r => !r.completed_at)
  const completedReminders = reminders.filter(r => r.completed_at)

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Reminder
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
              <label htmlFor="reminderTitle" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="reminderTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder description"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reminderAssignee" className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  id="reminderAssignee"
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
                <label htmlFor="remindAt" className="block text-sm font-medium text-gray-700">Remind At</label>
                <input
                  type="datetime-local"
                  id="remindAt"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reminderNotes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                id="reminderNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !title.trim() || !remindAt}
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

      {/* Pending reminders */}
      {pendingReminders.length > 0 && (
        <div className="mt-4 space-y-2">
          {pendingReminders.map((reminder) => {
            const remindDate = new Date(reminder.remind_at)
            const isPast = remindDate < new Date()

            return (
              <div key={reminder.id} className={`flex items-start justify-between rounded-md border p-3 ${isPast ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{reminder.title}</span>
                    {isPast && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">overdue</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {remindDate.toLocaleString()}
                  </p>
                  {reminder.notes && <p className="mt-1 text-sm text-gray-600">{reminder.notes}</p>}
                </div>
                <button
                  onClick={() => handleComplete(reminder)}
                  className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-green-50 hover:text-green-700"
                >
                  Complete
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed reminders */}
      {completedReminders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500">Completed ({completedReminders.length})</h3>
          <div className="mt-2 space-y-2">
            {completedReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <span className="text-sm text-gray-500 line-through">{reminder.title}</span>
                {reminder.completed_at && (
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(reminder.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-gray-500">No reminders yet.</p>
      )}
    </div>
  )
}
