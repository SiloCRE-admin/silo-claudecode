'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  RenewalOption,
  ExerciseWindowType,
  RollingTriggerType,
  NoticeMethod,
  RenewalRateBasis,
  FloorCapType,
  CpiFrequency,
} from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

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

const RATE_BASIS_OPTIONS: { value: RenewalRateBasis; label: string }[] = [
  { value: 'fmv', label: 'Fair Market Value' },
  { value: 'pct_fmv', label: '% of FMV' },
  { value: 'fixed_rate', label: 'Fixed Rate' },
  { value: 'cpi_adjustment', label: 'CPI Adjustment' },
]

const FLOOR_CAP_TYPES: { value: FloorCapType; label: string }[] = [
  { value: 'pct_prior_rent', label: '% of Prior Rent' },
  { value: 'fixed_sf', label: 'Fixed $/SF' },
  { value: 'other', label: 'Other' },
]

const CPI_FREQUENCIES: { value: CpiFrequency; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'other', label: 'Other' },
]

const FIELD_LABELS: Record<string, string> = {
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
  renewal_term_months: 'Renewal Term (months)',
  rate_basis: 'Rate Basis',
  pct_of_fmv: '% of FMV',
  floor_type: 'Floor Type',
  floor_value: 'Floor Value',
  floor_override_text: 'Floor Override Text',
  cap_type: 'Cap Type',
  cap_value: 'Cap Value',
  cap_override_text: 'Cap Override Text',
  cpi_index: 'CPI Index',
  cpi_frequency: 'CPI Frequency',
  cpi_min: 'CPI Min',
  cpi_max: 'CPI Max',
  commentary: 'Commentary',
}

interface RenewalOptionFormProps {
  option?: RenewalOption
  leaseCompId: string
  teamId: string
  userId: string
  nextOptionNumber: number
  onCancel: () => void
}

export default function RenewalOptionForm({
  option,
  leaseCompId,
  teamId,
  userId,
  nextOptionNumber,
  onCancel,
}: RenewalOptionFormProps) {
  const isEdit = !!option

  // Exercise Window
  const [exerciseWindowType, setExerciseWindowType] = useState<ExerciseWindowType | ''>(option?.exercise_window_type || '')
  const [exerciseDeadline, setExerciseDeadline] = useState(option?.exercise_deadline || '')
  const [windowStartDate, setWindowStartDate] = useState(option?.window_start_date || '')
  const [windowEndDate, setWindowEndDate] = useState(option?.window_end_date || '')
  const [rollingTriggerType, setRollingTriggerType] = useState<RollingTriggerType | ''>(option?.rolling_trigger_type || '')
  const [rollingTriggerMonths, setRollingTriggerMonths] = useState(option?.rolling_trigger_months?.toString() || '')
  const [rollingTriggerDate, setRollingTriggerDate] = useState(option?.rolling_trigger_date || '')

  // Notice
  const [noticeMethod, setNoticeMethod] = useState<NoticeMethod | ''>(option?.notice_method || '')
  const [noticeDaysPrior, setNoticeDaysPrior] = useState(option?.notice_days_prior?.toString() || '')
  const [noticeFixedDate, setNoticeFixedDate] = useState(option?.notice_fixed_date || '')

  // Renewal Term
  const [renewalTermMonths, setRenewalTermMonths] = useState(option?.renewal_term_months?.toString() || '')

  // Rate
  const [rateBasis, setRateBasis] = useState<RenewalRateBasis | ''>(option?.rate_basis || '')
  const [pctOfFmv, setPctOfFmv] = useState(option?.pct_of_fmv?.toString() || '')

  // Floor
  const [floorType, setFloorType] = useState<FloorCapType | ''>(option?.floor_type || '')
  const [floorValue, setFloorValue] = useState(option?.floor_value?.toString() || '')
  const [floorOverrideText, setFloorOverrideText] = useState(option?.floor_override_text || '')

  // Cap
  const [capType, setCapType] = useState<FloorCapType | ''>(option?.cap_type || '')
  const [capValue, setCapValue] = useState(option?.cap_value?.toString() || '')
  const [capOverrideText, setCapOverrideText] = useState(option?.cap_override_text || '')

  // CPI
  const [cpiIndex, setCpiIndex] = useState(option?.cpi_index || '')
  const [cpiFrequency, setCpiFrequency] = useState<CpiFrequency | ''>(option?.cpi_frequency || '')
  const [cpiMin, setCpiMin] = useState(option?.cpi_min || '')
  const [cpiMax, setCpiMax] = useState(option?.cpi_max || '')

  const [commentary, setCommentary] = useState(option?.commentary || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const buildPayload = () => ({
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
    renewal_term_months: renewalTermMonths ? parseInt(renewalTermMonths) : null,
    rate_basis: rateBasis || null,
    pct_of_fmv: pctOfFmv ? parseFloat(pctOfFmv) : null,
    floor_type: floorType || null,
    floor_value: floorValue ? parseFloat(floorValue) : null,
    floor_override_text: floorOverrideText.trim() || null,
    cap_type: capType || null,
    cap_value: capValue ? parseFloat(capValue) : null,
    cap_override_text: capOverrideText.trim() || null,
    cpi_index: cpiIndex.trim() || null,
    cpi_frequency: cpiFrequency || null,
    cpi_min: cpiMin.trim() || null,
    cpi_max: cpiMax.trim() || null,
    commentary: commentary.trim() || null,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload()

      if (isEdit && option) {
        const before: Record<string, unknown> = {}
        for (const key of Object.keys(FIELD_LABELS)) {
          before[key] = option[key as keyof RenewalOption]
        }

        const { error: updateError } = await supabase
          .from('lease_comp_renewal_options')
          .update({ ...payload, updated_by: userId })
          .eq('id', option.id)

        if (updateError) throw new Error(updateError.message)

        const diffs = computeDiffs(before, payload as Record<string, unknown>, FIELD_LABELS)
        if (diffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_edited',
            summary: `Renewal option #${option.option_number} edited`,
            actorUserId: userId, diffs,
          })
        }
      } else {
        const { error: insertError } = await supabase
          .from('lease_comp_renewal_options')
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
            summary: `Renewal option #${nextOptionNumber} added`,
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

      <div className="space-y-4">
        {/* Exercise Window */}
        <fieldset className="rounded-md border border-gray-100 p-3">
          <legend className="text-sm font-medium text-gray-700 px-1">Exercise Window</legend>
          <div className="space-y-3">
            <select value={exerciseWindowType} onChange={(e) => setExerciseWindowType(e.target.value as ExerciseWindowType)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">Select type...</option>
              {EXERCISE_WINDOW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {exerciseWindowType === 'by_deadline' && (
              <div>
                <label className="block text-sm text-gray-600">Deadline</label>
                <input type="date" value={exerciseDeadline} onChange={(e) => setExerciseDeadline(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}

            {exerciseWindowType === 'between_dates' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Start</label>
                  <input type="date" value={windowStartDate} onChange={(e) => setWindowStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">End</label>
                  <input type="date" value={windowEndDate} onChange={(e) => setWindowEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                </div>
              </div>
            )}

            {exerciseWindowType === 'rolling' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Trigger</label>
                  <select value={rollingTriggerType} onChange={(e) => setRollingTriggerType(e.target.value as RollingTriggerType)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                    <option value="">Select...</option>
                    {ROLLING_TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Months</label>
                  <input type="number" value={rollingTriggerMonths} onChange={(e) => setRollingTriggerMonths(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                </div>
                {rollingTriggerType === 'fixed_date' && (
                  <div>
                    <label className="block text-sm text-gray-600">Date</label>
                    <input type="date" value={rollingTriggerDate} onChange={(e) => setRollingTriggerDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        </fieldset>

        {/* Notice */}
        <fieldset className="rounded-md border border-gray-100 p-3">
          <legend className="text-sm font-medium text-gray-700 px-1">Notice</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <select value={noticeMethod} onChange={(e) => setNoticeMethod(e.target.value as NoticeMethod)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                <option value="">Select method...</option>
                {NOTICE_METHODS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            {noticeMethod === 'days_prior' && (
              <input type="number" value={noticeDaysPrior} onChange={(e) => setNoticeDaysPrior(e.target.value)}
                placeholder="Days prior"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            )}
            {noticeMethod === 'fixed_date' && (
              <input type="date" value={noticeFixedDate} onChange={(e) => setNoticeFixedDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
            )}
          </div>
        </fieldset>

        {/* Renewal Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Renewal Term (months)</label>
          <input type="number" value={renewalTermMonths} onChange={(e) => setRenewalTermMonths(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
        </div>

        {/* Rate */}
        <fieldset className="rounded-md border border-gray-100 p-3">
          <legend className="text-sm font-medium text-gray-700 px-1">Rate</legend>
          <div className="space-y-3">
            <select value={rateBasis} onChange={(e) => setRateBasis(e.target.value as RenewalRateBasis)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">Select basis...</option>
              {RATE_BASIS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            {rateBasis === 'pct_fmv' && (
              <div>
                <label className="block text-sm text-gray-600">% of FMV</label>
                <input type="number" step="0.01" value={pctOfFmv} onChange={(e) => setPctOfFmv(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}

            {rateBasis === 'cpi_adjustment' && (
              <div className="space-y-3 rounded-md bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600">CPI Index</label>
                    <input type="text" value={cpiIndex} onChange={(e) => setCpiIndex(e.target.value)}
                      placeholder="e.g., CPI-U"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Frequency</label>
                    <select value={cpiFrequency} onChange={(e) => setCpiFrequency(e.target.value as CpiFrequency)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                      <option value="">Select...</option>
                      {CPI_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600">Min</label>
                    <input type="text" value={cpiMin} onChange={(e) => setCpiMin(e.target.value)}
                      placeholder="e.g., 2%"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Max</label>
                    <input type="text" value={cpiMax} onChange={(e) => setCpiMax(e.target.value)}
                      placeholder="e.g., 5%"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {/* Floor */}
        <fieldset className="rounded-md border border-gray-100 p-3">
          <legend className="text-sm font-medium text-gray-700 px-1">Rate Floor</legend>
          <div className="space-y-3">
            <select value={floorType} onChange={(e) => setFloorType(e.target.value as FloorCapType)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">None</option>
              {FLOOR_CAP_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {floorType && floorType !== 'other' && (
              <div>
                <label className="block text-sm text-gray-600">Floor Value</label>
                <input type="number" step="0.01" value={floorValue} onChange={(e) => setFloorValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}
            {floorType === 'other' && (
              <div>
                <label className="block text-sm text-gray-600">Override Text</label>
                <input type="text" value={floorOverrideText} onChange={(e) => setFloorOverrideText(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}
          </div>
        </fieldset>

        {/* Cap */}
        <fieldset className="rounded-md border border-gray-100 p-3">
          <legend className="text-sm font-medium text-gray-700 px-1">Rate Cap</legend>
          <div className="space-y-3">
            <select value={capType} onChange={(e) => setCapType(e.target.value as FloorCapType)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
              <option value="">None</option>
              {FLOOR_CAP_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {capType && capType !== 'other' && (
              <div>
                <label className="block text-sm text-gray-600">Cap Value</label>
                <input type="number" step="0.01" value={capValue} onChange={(e) => setCapValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}
            {capType === 'other' && (
              <div>
                <label className="block text-sm text-gray-600">Override Text</label>
                <input type="text" value={capOverrideText} onChange={(e) => setCapOverrideText(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
              </div>
            )}
          </div>
        </fieldset>

        {/* Commentary */}
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
