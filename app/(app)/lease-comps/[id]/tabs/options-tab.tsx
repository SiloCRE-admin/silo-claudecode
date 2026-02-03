'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  LeaseCompWithBuilding,
  RenewalOption,
  TerminationOption,
  ExpansionOption,
  PurchaseOption,
} from '@/lib/types/lease-comps'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'
import RenewalOptionForm from '../options/renewal-option-form'
import TerminationOptionForm from '../options/termination-option-form'
import ExpansionOptionForm from '../options/expansion-option-form'
import PurchaseOptionForm from '../options/purchase-option-form'

interface OptionsTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  renewalOptions: RenewalOption[]
  terminationOptions: TerminationOption[]
  expansionOptions: ExpansionOption[]
  purchaseOptions: PurchaseOption[]
}

type OptionKind = 'renewal' | 'termination' | 'expansion' | 'purchase'

const KIND_LABELS: Record<OptionKind, string> = {
  renewal: 'Renewal',
  termination: 'Termination',
  expansion: 'Expansion',
  purchase: 'Purchase',
}

const SNAPSHOT_FIELDS: Record<OptionKind, Record<string, string>> = {
  renewal: {
    option_number: 'Option Number',
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
  },
  termination: {
    option_number: 'Option Number',
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
  },
  expansion: {
    option_number: 'Option Number',
    type: 'Type',
    subject_suite: 'Subject Suite',
    decision_window_days: 'Decision Window (days)',
    timing: 'Timing',
    timing_date: 'Timing Date',
    rate_basis: 'Rate Basis',
    commentary: 'Commentary',
  },
  purchase: {
    option_number: 'Option Number',
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
  },
}

export default function OptionsTab({
  comp,
  userId,
  teamId,
  renewalOptions,
  terminationOptions,
  expansionOptions,
  purchaseOptions,
}: OptionsTabProps) {
  const [addingType, setAddingType] = useState<OptionKind | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRemove = async (table: string, id: string, kind: OptionKind, optionNumber: number) => {
    const kindLabel = KIND_LABELS[kind]
    if (!confirm(`Remove this ${kindLabel} option?`)) return
    setError(null)

    try {
      // 1. Snapshot before delete — abort if fetch fails
      const { data: row, error: fetchError } = await supabase
        .from(table).select('*').eq('id', id).single()
      if (fetchError || !row) throw new Error(fetchError?.message || 'Option not found')

      // 2. Build snapshot diffs (old_value → null for each non-null field)
      const fieldLabels = SNAPSHOT_FIELDS[kind]
      const diffs: { field_label: string; old_value: string; new_value: null }[] = []
      for (const [key, label] of Object.entries(fieldLabels)) {
        const val = (row as Record<string, unknown>)[key]
        if (val != null) {
          diffs.push({ field_label: label, old_value: String(val), new_value: null })
        }
      }

      // 3. Log event + diffs atomically — abort if RPC fails (no delete yet)
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id, teamId,
        eventType: 'option_removed',
        summary: `${kindLabel} option #${optionNumber} removed`,
        actorUserId: userId, diffs,
      })

      // 4. Audit trail is secure — now delete the option
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
    }
  }

  const renderSection = (
    title: string,
    kind: OptionKind,
    options: { id: string; option_number: number; commentary?: string | null }[],
    table: string,
    renderForm: (opt: typeof options[number] | undefined, nextNum: number, onCancel: () => void) => React.ReactNode
  ) => {
    const nextNumber = options.length > 0 ? Math.max(...options.map(o => o.option_number)) + 1 : 1

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {addingType !== kind && (
            <button
              onClick={() => { setAddingType(kind); setEditingId(null) }}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
          )}
        </div>

        {/* Existing options */}
        {options.length > 0 && (
          <div className="mt-3 space-y-2">
            {options.map((opt) => (
              <div key={opt.id}>
                {editingId === opt.id ? (
                  renderForm(opt, 0, () => setEditingId(null))
                ) : (
                  <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        #{opt.option_number}
                      </span>
                      {opt.commentary && (
                        <span className="ml-2 text-sm text-gray-500">{opt.commentary}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(opt.id); setAddingType(null) }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(table, opt.id, kind, opt.option_number)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {addingType === kind && (
          <div className="mt-3">
            {renderForm(undefined, nextNumber, () => setAddingType(null))}
          </div>
        )}

        {options.length === 0 && addingType !== kind && (
          <p className="mt-3 text-sm text-gray-500">None</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {renderSection('Renewal Options', 'renewal', renewalOptions, 'lease_comp_renewal_options',
        (opt, nextNum, onCancel) => (
          <RenewalOptionForm
            option={opt ? renewalOptions.find(r => r.id === opt.id) : undefined}
            leaseCompId={comp.id} teamId={teamId} userId={userId}
            nextOptionNumber={nextNum} onCancel={onCancel}
          />
        )
      )}

      {renderSection('Termination Options', 'termination', terminationOptions, 'lease_comp_termination_options',
        (opt, nextNum, onCancel) => (
          <TerminationOptionForm
            option={opt ? terminationOptions.find(t => t.id === opt.id) : undefined}
            leaseCompId={comp.id} teamId={teamId} userId={userId}
            nextOptionNumber={nextNum} onCancel={onCancel}
          />
        )
      )}

      {renderSection('Expansion / ROFR Options', 'expansion', expansionOptions, 'lease_comp_expansion_options',
        (opt, nextNum, onCancel) => (
          <ExpansionOptionForm
            option={opt ? expansionOptions.find(e => e.id === opt.id) : undefined}
            leaseCompId={comp.id} teamId={teamId} userId={userId}
            nextOptionNumber={nextNum} onCancel={onCancel}
          />
        )
      )}

      {renderSection('Purchase Options', 'purchase', purchaseOptions, 'lease_comp_purchase_options',
        (opt, nextNum, onCancel) => (
          <PurchaseOptionForm
            option={opt ? purchaseOptions.find(p => p.id === opt.id) : undefined}
            leaseCompId={comp.id} teamId={teamId} userId={userId}
            nextOptionNumber={nextNum} onCancel={onCancel}
          />
        )
      )}
    </div>
  )
}
