'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  PurchaseOption,
  PurchaseStructure,
  ExerciseWindowType,
  RollingTriggerType,
  NoticeMethod,
  PurchasePriceBasis,
} from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

const STRUCTURES: { value: PurchaseStructure; label: string }[] = [
  { value: 'fixed_date', label: 'Fixed Date' },
  { value: 'rofr', label: 'Right of First Refusal' },
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

const PRICE_BASIS_OPTIONS: { value: PurchasePriceBasis; label: string }[] = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'fmv', label: 'Fair Market Value' },
  { value: 'formula_based', label: 'Formula Based' },
]

const FIELD_LABELS: Record<string, string> = {
  structure: 'Structure',
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
  price_basis: 'Price Basis',
  purchase_price_cents: 'Purchase Price',
  pricing_formula: 'Pricing Formula',
  commentary: 'Commentary',
}

interface PurchaseOptionFormProps {
  option?: PurchaseOption
  leaseCompId: string
  teamId: string
  userId: string
  nextOptionNumber: number
  onCancel: () => void
}

export default function PurchaseOptionForm({
  option,
  leaseCompId,
  teamId,
  userId,
  nextOptionNumber,
  onCancel,
}: PurchaseOptionFormProps) {
  const isEdit = !!option
  const [structure, setStructure] = useState<PurchaseStructure | ''>(option?.structure || '')
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
  const [priceBasis, setPriceBasis] = useState<PurchasePriceBasis | ''>(option?.price_basis || '')
  const [purchasePriceCents, setPurchasePriceCents] = useState(option?.purchase_price_cents?.toString() || '')
  const [pricingFormula, setPricingFormula] = useState(option?.pricing_formula || '')
  const [commentary, setCommentary] = useState(option?.commentary || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const buildPayload = () => ({
    structure: structure || null,
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
    price_basis: priceBasis || null,
    purchase_price_cents: purchasePriceCents ? parseInt(purchasePriceCents) : null,
    pricing_formula: pricingFormula.trim() || null,
    commentary: commentary.trim() || null,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload()

      if (isEdit && option) {
        const before: Record<string, unknown> = {
          structure: option.structure,
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
          price_basis: option.price_basis,
          purchase_price_cents: option.purchase_price_cents,
          pricing_formula: option.pricing_formula,
          commentary: option.commentary,
        }

        const { error: updateError } = await supabase
          .from('lease_comp_purchase_options')
          .update({ ...payload, updated_by: userId })
          .eq('id', option.id)

        if (updateError) throw new Error(updateError.message)

        const diffs = computeDiffs(before, payload as Record<string, unknown>, FIELD_LABELS)
        if (diffs.length > 0) {
          await logLeaseCompEvent(supabase, {
            leaseCompId, teamId, eventType: 'option_edited',
            summary: `Purchase option #${option.option_number} edited`,
            actorUserId: userId, diffs,
          })
        }
      } else {
        const { error: insertError } = await supabase
          .from('lease_comp_purchase_options')
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
            summary: `Purchase option #${nextOptionNumber} added`,
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
          <label className="block text-sm font-medium text-gray-700">Structure</label>
          <select value={structure} onChange={(e) => setStructure(e.target.value as PurchaseStructure)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
            <option value="">Select...</option>
            {STRUCTURES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Price Basis</label>
          <select value={priceBasis} onChange={(e) => setPriceBasis(e.target.value as PurchasePriceBasis)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
            <option value="">Select...</option>
            {PRICE_BASIS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {priceBasis === 'fixed_price' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price (cents)</label>
            <input type="number" value={purchasePriceCents} onChange={(e) => setPurchasePriceCents(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
          </div>
        )}

        {priceBasis === 'formula_based' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Pricing Formula</label>
            <textarea value={pricingFormula} onChange={(e) => setPricingFormula(e.target.value)} rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
          </div>
        )}

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
