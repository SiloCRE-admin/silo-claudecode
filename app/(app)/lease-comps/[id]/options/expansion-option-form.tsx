'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  ExpansionOption,
  ExpansionOptionType,
  ExpansionTiming,
  ExpansionRateBasis,
} from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

const EXPANSION_TYPES: { value: ExpansionOptionType; label: string }[] = [
  { value: 'rofo', label: 'Right of First Offer' },
  { value: 'rofr', label: 'Right of First Refusal' },
  { value: 'fixed_expansion', label: 'Fixed Expansion' },
  { value: 'must_take', label: 'Must Take' },
]

const TIMING_OPTIONS: { value: ExpansionTiming; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'date_specific', label: 'Date Specific' },
]

const RATE_BASIS_OPTIONS: { value: ExpansionRateBasis; label: string }[] = [
  { value: 'fmv', label: 'Fair Market Value' },
  { value: 'same_terms', label: 'Same Terms' },
  { value: 'fixed_rate', label: 'Fixed Rate' },
  { value: 'pre_agreed', label: 'Pre-Agreed' },
]

const FIELD_LABELS: Record<string, string> = {
  type: 'Type',
  subject_suite: 'Subject Suite',
  decision_window_days: 'Decision Window (days)',
  timing: 'Timing',
  timing_date: 'Timing Date',
  rate_basis: 'Rate Basis',
  commentary: 'Commentary',
}

interface ExpansionOptionFormProps {
  option?: ExpansionOption
  leaseCompId: string
  teamId: string
  userId: string
  nextOptionNumber: number
  onCancel: () => void
}

export default function ExpansionOptionForm({
  option,
  leaseCompId,
  teamId,
  userId,
  nextOptionNumber,
  onCancel,
}: ExpansionOptionFormProps) {
  const isEdit = !!option
  const [type, setType] = useState<ExpansionOptionType | ''>(option?.type || '')
  const [subjectSuite, setSubjectSuite] = useState(option?.subject_suite || '')
  const [decisionWindowDays, setDecisionWindowDays] = useState(option?.decision_window_days?.toString() || '')
  const [timing, setTiming] = useState<ExpansionTiming | ''>(option?.timing || '')
  const [timingDate, setTimingDate] = useState(option?.timing_date || '')
  const [rateBasis, setRateBasis] = useState<ExpansionRateBasis | ''>(option?.rate_basis || '')
  const [commentary, setCommentary] = useState(option?.commentary || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const buildPayload = () => ({
    type: type || null,
    subject_suite: subjectSuite.trim() || null,
    decision_window_days: decisionWindowDays ? parseInt(decisionWindowDays) : null,
    timing: timing || null,
    timing_date: timingDate || null,
    rate_basis: rateBasis || null,
    commentary: commentary.trim() || null,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload()

      if (isEdit && option) {
        // Snapshot before
        const before: Record<string, unknown> = {
          type: option.type,
          subject_suite: option.subject_suite,
          decision_window_days: option.decision_window_days,
          timing: option.timing,
          timing_date: option.timing_date,
          rate_basis: option.rate_basis,
          commentary: option.commentary,
        }

        const { error: updateError } = await supabase
          .from('lease_comp_expansion_options')
          .update({ ...payload, updated_by: userId })
          .eq('id', option.id)

        if (updateError) throw new Error(updateError.message)

        const diffs = computeDiffs(before, payload as Record<string, unknown>, FIELD_LABELS)
        if (diffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_edited',
            summary: `Expansion option #${option.option_number} edited`,
            actorUserId: userId, diffs,
          })
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('lease_comp_expansion_options')
          .insert({
            lease_comp_id: leaseCompId,
            team_id: teamId,
            option_number: nextOptionNumber,
            ...payload,
            created_by: userId,
            updated_by: userId,
          })

        if (insertError) throw new Error(insertError.message)

        const newDiffs = computeDiffs(
          {} as Record<string, unknown>,
          payload as Record<string, unknown>,
          FIELD_LABELS
        )
        if (newDiffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_added',
            summary: `Expansion option #${nextOptionNumber} added`,
            actorUserId: userId, diffs: newDiffs,
          })
        }
      }

      onCancel()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-gray-200 p-4">
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ExpansionOptionType)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">Select...</option>
              {EXPANSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Suite</label>
            <input type="text" value={subjectSuite} onChange={(e) => setSubjectSuite(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Decision Window (days)</label>
            <input type="number" value={decisionWindowDays} onChange={(e) => setDecisionWindowDays(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timing</label>
            <select value={timing} onChange={(e) => setTiming(e.target.value as ExpansionTiming)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">Select...</option>
              {TIMING_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {timing === 'date_specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Timing Date</label>
              <input type="date" value={timingDate} onChange={(e) => setTimingDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rate Basis</label>
          <select value={rateBasis} onChange={(e) => setRateBasis(e.target.value as ExpansionRateBasis)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
            <option value="">Select...</option>
            {RATE_BASIS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Commentary</label>
          <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400">
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
          </button>
          <button onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
