'use client'

import { useState } from 'react'
import type { LeaseCompEventWithDiffs } from '@/lib/types/lease-comps'

interface HistoryTabProps {
  events: LeaseCompEventWithDiffs[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  comp_created: 'Comp Created',
  comp_duplicated: 'Comp Duplicated',
  status_changed: 'Status Changed',
  confidentiality_changed: 'Confidentiality Changed',
  export_level_changed: 'Export Level Changed',
  option_added: 'Option Added',
  option_edited: 'Option Edited',
  option_removed: 'Option Removed',
  file_added: 'File Added',
  file_removed: 'File Removed',
  task_created: 'Task Created',
  task_completed: 'Task Completed',
  reminder_created: 'Reminder Created',
  reminder_completed: 'Reminder Completed',
  fields_edited: 'Fields Edited',
}

export default function HistoryTab({ events }: HistoryTabProps) {
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedEventIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        <p className="mt-4 text-sm text-gray-500">No events recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900">History</h2>

      <div className="mt-4 space-y-3">
        {events.map((event) => {
          const isExpanded = expandedEventIds.has(event.id)
          const hasDiffs = event.diffs.length > 0

          return (
            <div key={event.id} className="rounded-md border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{event.summary}</p>
                </div>
                {hasDiffs && (
                  <button
                    onClick={() => toggleExpanded(event.id)}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? 'Hide details' : `${event.diffs.length} change${event.diffs.length === 1 ? '' : 's'}`}
                  </button>
                )}
              </div>

              {isExpanded && hasDiffs && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="pb-1 pr-4">Field</th>
                        <th className="pb-1 pr-4">Before</th>
                        <th className="pb-1">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.diffs.map((diff) => (
                        <tr key={diff.id} className="border-t border-gray-50">
                          <td className="py-1 pr-4 font-medium text-gray-700">{diff.field_label}</td>
                          <td className="py-1 pr-4 text-red-600">{diff.old_value ?? '(empty)'}</td>
                          <td className="py-1 text-green-600">{diff.new_value ?? '(empty)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
