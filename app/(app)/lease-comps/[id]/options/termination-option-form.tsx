'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  TerminationOption,
  TerminationOptionType,
  ExerciseWindowType,
  RollingTriggerType,
  NoticeMethod,
} from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

const TERMINATION_TYPES: { value: TerminationOptionType; label: string }[] = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'ongoing', label: 'Ongoing' },
]

const EXERCISE_WINDOW_TYPES: { value: ExerciseWindowType; label: string }[] = [
  { value: 'by_deadline', label: 'By Deadline' },
  { value: 'between_dates', label: 'Between Dates' },
  { value: 'rolling', label: 'Rolling' },
]

const ROLLING_TRIGGER_TYPES: { value: RollingTriggerType; label: string }[] = [
  { value: 'lease_start', label: 'Lease Start' },
  { value: 'lease_end', label: 'Lease End' },
  { value: 'fixed_date', label: 'Fixed Date' },
]

const NOTICE_METHODS: { value: NoticeMethod; label: string }[] = [
  { value: 'days_prior', label: 'Days Prior' },
  { value: 'fixed_date', label: 'Fixed Date' },
]

const FIELD_LABELS: Record<string, string> = {
  type: 'Type',
  exercise_window_type: 'Exercise Window Type',
  exercise_deadline: 'Exercise Deadline',
  window_start_date: 'Window Start Date',
  window_end_date: 'Window End Date',
  rolling_trigger_type: 'Rolling Trigger Type',
  rolling_trigger_months: 'Rolling Trigger Months',
  rolling_trigger_date: 'Rolling Trigger Date',
  notice_method: 'Notice Method',
  notice_days_prior: 'Notice Days Prior',
  notice_fixed_date: 'Notice Fixed Date',
  termination_fee_cents: 'Termination Fee',
  commentary: 'Commentary',
}

interface TerminationOptionFormProps {
  option?: TerminationOption
  leaseCompId: string
  teamId: string
  userId: string
  nextOptionNumber: number
  onCancel: () => void
}

export default function TerminationOptionForm({
  option,
  leaseCompId,
  teamId,
  userId,
  nextOptionNumber,
  onCancel,
}: TerminationOptionFormProps) {
  const isEdit = !!option
  const [type, setType] = useState<TerminationOptionType | ''>(option?.type || '')
  const [exerciseWindowType, setExerciseWindowType] = useState<ExerciseWindowType | ''>(option?.exercise_window_type || '')
  const [exerciseDeadline, setExerciseDeadline] = useState(option?.exercise_deadline || '')
  const [windowStartDate, setWindowStartDate] = useState(option?.window_start_date || '')
  const [windowEndDate, setWindowEndDate] = useState(option?.window_end_date || '')
  const [rollingTriggerType, setRollingTriggerType] = useState<RollingTriggerType | ''>(option?.rolling_trigger_type || '')
  const [rollingTriggerMonths, setRollingTriggerMonths] = useState(option?.rolling_trigger_months?.toString() || '')
  const [rollingTriggerDate, setRollingTriggerDate] = useState(option?.rolling_trigger_date || '')
  const [noticeMethod, setNoticeMethod] = useState<NoticeMethod | ''>(option?.notice_method || '')
  const [noticeDaysPrior, setNoticeDaysPrior] = useState(option?.notice_days_prior?.toString() || '')
  const [noticeFixedDate, setNoticeFixedDate] = useState(option?.notice_fixed_date || '')
  const [terminationFeeCents, setTerminationFeeCents] = useState(option?.termination_fee_cents?.toString() || '')
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
    exercise_window_type: exerciseWindowType || null,
    exercise_deadline: exerciseDeadline || null,
    window_start_date: windowStartDate || null,
    window_end_date: windowEndDate || null,
    rolling_trigger_type: rollingTriggerType || null,
    rolling_trigger_months: rollingTriggerMonths ? parseInt(rollingTriggerMonths) : null,
    rolling_trigger_date: rollingTriggerDate || null,
    notice_method: noticeMethod || null,
    notice_days_prior: noticeDaysPrior ? parseInt(noticeDaysPrior) : null,
    notice_fixed_date: noticeFixedDate || null,
    termination_fee_cents: terminationFeeCents ? parseInt(terminationFeeCents) : null,
    commentary: commentary.trim() || null,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload()

      if (isEdit && option) {
        const before: Record<string, unknown> = {
          type: option.type,
          exercise_window_type: option.exercise_window_type,
          exercise_deadline: option.exercise_deadline,
          window_start_date: option.window_start_date,
          window_end_date: option.window_end_date,
          rolling_trigger_type: option.rolling_trigger_type,
          rolling_trigger_months: option.rolling_trigger_months,
          rolling_trigger_date: option.rolling_trigger_date,
          notice_method: option.notice_method,
          notice_days_prior: option.notice_days_prior,
          notice_fixed_date: option.notice_fixed_date,
          termination_fee_cents: option.termination_fee_cents,
          commentary: option.commentary,
        }

        const { error: updateError } = await supabase
          .from('lease_comp_termination_options')
          .update({ ...payload, updated_by: userId })
          .eq('id', option.id)

        if (updateError) throw new Error(updateError.message)

        const diffs = computeDiffs(before, payload as Record<string, unknown>, FIELD_LABELS)
        if (diffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_edited',
            summary: `Termination option #${option.option_number} edited`,
            actorUserId: userId, diffs,
          })
        }
      } else {
        const { error: insertError } = await supabase
          .from('lease_comp_termination_options')
          .insert({
            lease_comp_id: leaseCompId, team_id: teamId,
            option_number: nextOptionNumber,
            ...payload,
            created_by: userId, updated_by: userId,
          })

        if (insertError) throw new Error(insertError.message)

        const newDiffs = computeDiffs({} as Record<string, unknown>, payload as Record<string, unknown>, FIELD_LABELS)
        if (newDiffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_added',
            summary: `Termination option #${nextOptionNumber} added`,
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as TerminationOptionType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
            <option value="">Select...</option>
            {TERMINATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Exercise Window */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Exercise Window</label>
          <select value={exerciseWindowType} onChange={(e) => setExerciseWindowType(e.target.value as ExerciseWindowType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
            <option value="">Select...</option>
            {EXERCISE_WINDOW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {exerciseWindowType === 'by_deadline' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Exercise Deadline</label>
            <input type="date" value={exerciseDeadline} onChange={(e) => setExerciseDeadline(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
          </div>
        )}

        {exerciseWindowType === 'between_dates' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Window Start</label>
              <input type="date" value={windowStartDate} onChange={(e) => setWindowStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Window End</label>
              <input type="date" value={windowEndDate} onChange={(e) => setWindowEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
          </div>
        )}

        {exerciseWindowType === 'rolling' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Trigger Type</label>
              <select value={rollingTriggerType} onChange={(e) => setRollingTriggerType(e.target.value as RollingTriggerType)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                <option value="">Select...</option>
                {ROLLING_TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Months</label>
              <input type="number" value={rollingTriggerMonths} onChange={(e) => setRollingTriggerMonths(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
            {rollingTriggerType === 'fixed_date' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Trigger Date</label>
                <input type="date" value={rollingTriggerDate} onChange={(e) => setRollingTriggerDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}
          </div>
        )}

        {/* Notice */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Notice Method</label>
            <select value={noticeMethod} onChange={(e) => setNoticeMethod(e.target.value as NoticeMethod)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">Select...</option>
              {NOTICE_METHODS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
          {noticeMethod === 'days_prior' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Days Prior</label>
              <input type="number" value={noticeDaysPrior} onChange={(e) => setNoticeDaysPrior(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
          )}
          {noticeMethod === 'fixed_date' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Notice Date</label>
              <input type="date" value={noticeFixedDate} onChange={(e) => setNoticeFixedDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Termination Fee (cents)</label>
          <input type="number" value={terminationFeeCents} onChange={(e) => setTerminationFeeCents(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
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
