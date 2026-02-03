'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { LeaseCompWithBuilding, InternalAccessLevel, ExportDetailLevel } from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

const ACCESS_LEVELS: { value: InternalAccessLevel; label: string }[] = [
  { value: 'all_team', label: 'All Team Members' },
  { value: 'owner_admin_me', label: 'Owner, Admins & Me' },
  { value: 'owner_me', label: 'Owner & Me' },
  { value: 'just_me', label: 'Just Me' },
]

const EXPORT_LEVELS: { value: ExportDetailLevel; label: string }[] = [
  { value: 'all_visible', label: 'All Fields Visible' },
  { value: 'hide_major_terms', label: 'Hide Major Terms' },
  { value: 'hide_all', label: 'Hide All' },
  { value: 'excluded', label: 'Excluded from Export' },
]

const FIELD_LABELS: Record<string, string> = {
  internal_access_level: 'Internal Access Level',
  export_detail_level: 'Export Detail Level',
}

interface ConfidentialityTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

export default function ConfidentialityTab({ comp, userId, teamId }: ConfidentialityTabProps) {
  const [accessLevel, setAccessLevel] = useState<InternalAccessLevel>(comp.internal_access_level)
  const [exportLevel, setExportLevel] = useState<ExportDetailLevel>(comp.export_detail_level)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const hasChanges =
    accessLevel !== comp.internal_access_level ||
    exportLevel !== comp.export_detail_level

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const before = {
        internal_access_level: comp.internal_access_level,
        export_detail_level: comp.export_detail_level,
      }
      const after = {
        internal_access_level: accessLevel,
        export_detail_level: exportLevel,
      }

      // Update comp
      const { error: updateError } = await supabase
        .from('lease_comps')
        .update({
          internal_access_level: accessLevel,
          export_detail_level: exportLevel,
          updated_by: userId,
        })
        .eq('id', comp.id)

      if (updateError) throw new Error(updateError.message)

      // Compute diffs and log events atomically
      const diffs = computeDiffs(before, after, FIELD_LABELS)

      if (diffs.length > 0) {
        const accessChanged = diffs.some(d => d.field_label === 'Internal Access Level')
        const exportChanged = diffs.some(d => d.field_label === 'Export Detail Level')

        if (accessChanged) {
          const accessDiffs = diffs.filter(d => d.field_label === 'Internal Access Level')
          await logLeaseCompEvent(supabase, {
            leaseCompId: comp.id, teamId,
            eventType: 'confidentiality_changed',
            summary: accessDiffs.map(d => `${d.field_label}: ${d.old_value} → ${d.new_value}`).join(', '),
            actorUserId: userId, diffs: accessDiffs,
          })
        }

        if (exportChanged) {
          const exportDiffs = diffs.filter(d => d.field_label === 'Export Detail Level')
          await logLeaseCompEvent(supabase, {
            leaseCompId: comp.id, teamId,
            eventType: 'export_level_changed',
            summary: exportDiffs.map(d => `${d.field_label}: ${d.old_value} → ${d.new_value}`).join(', '),
            actorUserId: userId, diffs: exportDiffs,
          })
        }
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900">Confidentiality Settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Control who can see this comp within your team and what is included in exports.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Confidentiality settings saved.</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700">
            Internal Access Level
          </label>
          <select
            id="accessLevel"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as InternalAccessLevel)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {ACCESS_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exportLevel" className="block text-sm font-medium text-gray-700">
            Export Detail Level
          </label>
          <select
            id="exportLevel"
            value={exportLevel}
            onChange={(e) => setExportLevel(e.target.value as ExportDetailLevel)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {EXPORT_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* TODO: export redaction logic — currently stores value only */}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
