'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  LeaseCompWithBuilding,
  LeaseType,
  LeaseStatus,
  LeaseSfType,
  OfficeSfLeaseType,
  Confidence,
  RateUnits,
  ReimbursementMethod,
  EscalationUnits,
  FreeRentUnits,
  TiUnits,
  CompEventType,
} from '@/lib/types/lease-comps'
import { computeDiffs } from '@/lib/utils/diff-helpers'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'
import { deriveLeaseEndDate, endOfMonth } from '@/lib/utils/date-helpers'
import FormSection from '@/components/lease-comps/form-section'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, DollarSign, TrendingUp, Gift, Hammer, MessageSquare } from 'lucide-react'

// ---------------------------------------------------------------------------
// Dropdown option definitions (labels match spec §3.1 exactly)
// ---------------------------------------------------------------------------

const LEASE_TYPE_OPTIONS: { value: LeaseType; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'sublease', label: 'Sublease' },
]

const LEASE_STATUS_OPTIONS: { value: LeaseStatus; label: string }[] = [
  { value: 'signed', label: 'Signed' },
  { value: 'pending', label: 'Pending' },
  { value: 'proposal', label: 'Proposal' },
]

const LEASE_SF_TYPE_OPTIONS: { value: LeaseSfType; label: string }[] = [
  { value: 'single_story', label: 'Single Story' },
  { value: 'rba_incl_2nd_fl', label: 'RBA Incl 2nd Fl' },
]

const OFFICE_SF_TYPE_OPTIONS: { value: OfficeSfLeaseType; label: string }[] = [
  { value: 'single_story', label: 'Single Story' },
  { value: 'multi_story', label: 'Multi-Story' },
]

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'estimated', label: 'Estimated' },
]

const RATE_UNIT_OPTIONS: { value: RateUnits; label: string }[] = [
  { value: 'sf_yr', label: '$/SF/Yr' },
  { value: 'sf_mo', label: '$/SF/Mo' },
  { value: 'mo', label: '$/Mo' },
  { value: 'yr', label: '$/Yr' },
  { value: 'ac_mo', label: '$/Ac/Mo' },
  { value: 'lsf_yr', label: '$/LSF/Yr' },
  { value: 'lsf_mo', label: '$/LSF/Mo' },
]

const REIMBURSEMENT_OPTIONS: { value: ReimbursementMethod; label: string }[] = [
  { value: 'net', label: 'Net' },
  { value: 'gross', label: 'Gross' },
  { value: 'modified_gross', label: 'Modified Gross' },
  { value: 'base_year', label: 'Base Year' },
  { value: 'other', label: 'Other' },
]

const ESCALATION_UNIT_OPTIONS: { value: EscalationUnits; label: string }[] = [
  { value: 'pct', label: '%' },
  { value: 'sf', label: '$/SF' },
  { value: 'mo', label: '$/Mo' },
]

const FREE_RENT_UNIT_OPTIONS: { value: FreeRentUnits; label: string }[] = [
  { value: 'mos', label: 'Months' },
  { value: 'amount', label: '$ Amt' },
]

const TI_UNIT_OPTIONS: { value: TiUnits; label: string }[] = [
  { value: 'sf', label: '$/SF' },
  { value: 'amount', label: '$ Amt' },
]

// ---------------------------------------------------------------------------
// Field labels for diff tracking (keys = DB column names)
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  lease_type: 'Lease Type',
  lease_status: 'Lease Status',
  lease_sf: 'Lease SF',
  lease_sf_type: 'Lease SF Type',
  lease_sf_confidence: 'Lease SF Confidence',
  office_sf_lease: 'Office SF (Lease)',
  office_pct_lease: 'Office %',
  office_sf_lease_type: 'Office SF Type',
  office_sf_lease_confidence: 'Office SF Confidence',
  signed_date: 'Lease Sign Date',
  signed_date_confidence: 'Lease Sign Date Confidence',
  lease_start_date: 'Lease Start Date',
  lease_start_date_confidence: 'Lease Start Date Confidence',
  lease_term_months: 'Term (Months)',
  lease_term_months_confidence: 'Term Confidence',
  lease_end_date: 'Lease End Date',
  lease_end_date_confidence: 'Lease End Date Confidence',
  rent_psf_cents: 'Starting Rate',
  starting_rate_units: 'Starting Rate Units',
  starting_rate_confidence: 'Starting Rate Confidence',
  reimbursement_method: 'Reimbursement Method',
  opex_cents: 'Est. Yr 1 OpEx',
  opex_units: 'Est. Yr 1 OpEx Units',
  opex_confidence: 'Est. Yr 1 OpEx Confidence',
  escalation_value: 'Escalations',
  escalation_units: 'Escalation Units',
  escalation_frequency_months: 'Escalation Frequency (Months)',
  escalation_confidence: 'Escalation Confidence',
  free_rent_months: 'Free Rent (Months)',
  free_rent_amount_cents: 'Free Rent (Amount)',
  free_rent_units: 'Free Rent Units',
  free_rent_confidence: 'Free Rent Confidence',
  ti_allowance_cents: 'TI',
  ti_units: 'TI Units',
  ti_confidence: 'TI Confidence',
  presentation_comments_external: 'Presentation Comments (External)',
  presentation_comments_internal: 'Presentation Comments (Internal)',
  misc_commentary: 'Misc Commentary',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert cents to display dollars (e.g. 1250 → "12.50") */
function centsToDollars(cents: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2)
}

/** Convert display dollars to cents (e.g. "12.50" → 1250). Empty/invalid → null. */
function dollarsToCents(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val)
  if (isNaN(n) || n < 0) return null
  return Math.round(n * 100)
}

/** Parse non-negative integer from string. Empty/invalid → null. */
function parseNonNegInt(val: string): number | null {
  if (!val.trim()) return null
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 0) return null
  return n
}

/** Parse non-negative float from string. Empty/invalid → null. */
function parseNonNegFloat(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val)
  if (isNaN(n) || n < 0) return null
  return n
}

/** Detect RLS / permission errors from Supabase error messages */
function isPermissionError(msg: string): boolean {
  const lower = msg.toLowerCase()
  return (
    lower.includes('permission denied') ||
    lower.includes('insufficient_privilege') ||
    lower.includes('row-level security') ||
    lower.includes('42501')
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LeaseDetailsTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

export default function LeaseDetailsTab({ comp, userId, teamId }: LeaseDetailsTabProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- Form state (initialized from comp) ---
  const [leaseType, setLeaseType] = useState(comp.lease_type ?? '')
  const [leaseStatus, setLeaseStatus] = useState(comp.lease_status ?? '')
  const [leaseSf, setLeaseSf] = useState(comp.lease_sf?.toString() ?? '')
  const [leaseSfType, setLeaseSfType] = useState(comp.lease_sf_type ?? '')
  const [leaseSfConfidence, setLeaseSfConfidence] = useState(comp.lease_sf_confidence ?? '')
  const [officeSfLease, setOfficeSfLease] = useState(comp.office_sf_lease?.toString() ?? '')
  const [officePctLease, setOfficePctLease] = useState(comp.office_pct_lease?.toString() ?? '')
  const [officeSfLeaseType, setOfficeSfLeaseType] = useState(comp.office_sf_lease_type ?? '')
  const [officeSfLeaseConfidence, setOfficeSfLeaseConfidence] = useState(comp.office_sf_lease_confidence ?? '')
  const [signedDate, setSignedDate] = useState(comp.signed_date ?? '')
  const [signedDateConfidence, setSignedDateConfidence] = useState(comp.signed_date_confidence ?? '')
  const [leaseStartDate, setLeaseStartDate] = useState(comp.lease_start_date ?? '')
  const [leaseStartDateConfidence, setLeaseStartDateConfidence] = useState(comp.lease_start_date_confidence ?? '')
  const [termMonths, setTermMonths] = useState(comp.lease_term_months?.toString() ?? '')
  const [termMonthsConfidence, setTermMonthsConfidence] = useState(comp.lease_term_months_confidence ?? '')
  const [leaseEndDate, setLeaseEndDate] = useState(comp.lease_end_date ?? '')
  const [leaseEndDateConfidence, setLeaseEndDateConfidence] = useState(comp.lease_end_date_confidence ?? '')
  const [startingRate, setStartingRate] = useState(centsToDollars(comp.rent_psf_cents))
  const [startingRateUnits, setStartingRateUnits] = useState(comp.starting_rate_units ?? '')
  const [startingRateConfidence, setStartingRateConfidence] = useState(comp.starting_rate_confidence ?? '')
  const [reimbursementMethod, setReimbursementMethod] = useState(comp.reimbursement_method ?? '')
  const [opex, setOpex] = useState(centsToDollars(comp.opex_cents))
  const [opexUnits, setOpexUnits] = useState(comp.opex_units ?? '')
  const [opexConfidence, setOpexConfidence] = useState(comp.opex_confidence ?? '')
  const [escalationValue, setEscalationValue] = useState(comp.escalation_value?.toString() ?? '')
  const [escalationUnits, setEscalationUnits] = useState(comp.escalation_units ?? '')
  const [escalationFrequency, setEscalationFrequency] = useState(comp.escalation_frequency_months?.toString() ?? '')
  const [escalationConfidence, setEscalationConfidence] = useState(comp.escalation_confidence ?? '')
  const [freeRentValue, setFreeRentValue] = useState(() => {
    if (comp.free_rent_units === 'amount') return centsToDollars(comp.free_rent_amount_cents)
    return comp.free_rent_months?.toString() ?? ''
  })
  const [freeRentUnits, setFreeRentUnits] = useState(comp.free_rent_units ?? '')
  const [freeRentConfidence, setFreeRentConfidence] = useState(comp.free_rent_confidence ?? '')
  const [tiValue, setTiValue] = useState(centsToDollars(comp.ti_allowance_cents))
  const [tiUnits, setTiUnits] = useState(comp.ti_units ?? '')
  const [tiConfidence, setTiConfidence] = useState(comp.ti_confidence ?? '')
  const [commentsExternal, setCommentsExternal] = useState(comp.presentation_comments_external ?? '')
  const [commentsInternal, setCommentsInternal] = useState(comp.presentation_comments_internal ?? '')
  const [miscCommentary, setMiscCommentary] = useState(comp.misc_commentary ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      successTimerRef.current = setTimeout(() => setSuccess(false), 4000)
    }
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [success])

  // --- Escalation inline warnings ---
  const escalationPartial =
    (escalationValue && !escalationUnits) ||
    (!escalationValue && escalationUnits) ||
    ((escalationValue || escalationUnits) && !escalationFrequency)

  // --- Office SF ↔ Office % bidirectional helpers ---
  const handleOfficeSfChange = useCallback((val: string) => {
    setOfficeSfLease(val)
    const sf = parseInt(val, 10)
    const lsf = parseInt(leaseSf, 10)
    if (!isNaN(sf) && !isNaN(lsf) && lsf > 0) {
      const pct = Math.min((sf / lsf) * 100, 100)
      setOfficePctLease(pct.toFixed(1))
    }
  }, [leaseSf])

  const handleOfficePctChange = useCallback((val: string) => {
    setOfficePctLease(val)
    const pct = parseFloat(val)
    const lsf = parseInt(leaseSf, 10)
    if (!isNaN(pct) && !isNaN(lsf) && lsf > 0 && pct >= 0 && pct <= 100) {
      setOfficeSfLease(Math.round(lsf * (pct / 100)).toString())
    }
  }, [leaseSf])

  // --- Compute End Date helper ---
  const canComputeEndDate = !readOnly && leaseStartDate && termMonths && parseInt(termMonths, 10) > 0
  const handleComputeEndDate = () => {
    if (!canComputeEndDate) return
    setLeaseEndDate(deriveLeaseEndDate(leaseStartDate, parseInt(termMonths, 10)))
  }

  // --- Build payload for saving ---
  const buildPayload = () => {
    const termVal = parseNonNegInt(termMonths)
    const payload: Record<string, unknown> = {
      lease_type: leaseType || null,
      lease_status: leaseStatus || null,
      lease_sf: parseNonNegInt(leaseSf),
      lease_sf_type: leaseSfType || null,
      lease_sf_confidence: leaseSfConfidence || null,
      office_sf_lease: parseNonNegInt(officeSfLease),
      office_pct_lease: officePctLease.trim() !== '' ? Math.min(parseNonNegFloat(officePctLease) ?? 0, 100) : null,
      office_sf_lease_type: officeSfLeaseType || null,
      office_sf_lease_confidence: officeSfLeaseConfidence || null,
      signed_date: signedDate || null,
      signed_date_confidence: signedDateConfidence || null,
      lease_start_date: leaseStartDate || null,
      lease_start_date_confidence: leaseStartDateConfidence || null,
      lease_term_months: termVal != null ? Math.min(termVal, 1200) : null,
      lease_term_months_confidence: termMonthsConfidence || null,
      lease_end_date: leaseEndDate ? endOfMonth(leaseEndDate) : null,
      lease_end_date_confidence: leaseEndDateConfidence || null,
      rent_psf_cents: dollarsToCents(startingRate),
      starting_rate_units: startingRateUnits || null,
      starting_rate_confidence: startingRateConfidence || null,
      reimbursement_method: reimbursementMethod || null,
      opex_cents: dollarsToCents(opex),
      opex_units: opexUnits || null,
      opex_confidence: opexConfidence || null,
      escalation_value: parseNonNegFloat(escalationValue),
      escalation_units: escalationUnits || null,
      escalation_frequency_months: parseNonNegInt(escalationFrequency),
      escalation_confidence: escalationConfidence || null,
      free_rent_months: freeRentUnits === 'mos'
        ? parseNonNegInt(freeRentValue)
        : (freeRentUnits === '' ? parseNonNegInt(freeRentValue) : comp.free_rent_months),
      free_rent_amount_cents: freeRentUnits === 'amount'
        ? dollarsToCents(freeRentValue)
        : comp.free_rent_amount_cents,
      free_rent_units: freeRentUnits || null,
      free_rent_confidence: freeRentConfidence || null,
      ti_allowance_cents: dollarsToCents(tiValue),
      ti_units: tiUnits || null,
      ti_confidence: tiConfidence || null,
      presentation_comments_external: commentsExternal || null,
      presentation_comments_internal: commentsInternal || null,
      misc_commentary: miscCommentary || null,
    }
    return payload
  }

  // --- Build "before" snapshot from comp ---
  const buildBefore = (): Record<string, unknown> => {
    const before: Record<string, unknown> = {}
    for (const key of Object.keys(FIELD_LABELS)) {
      before[key] = comp[key as keyof LeaseCompWithBuilding] ?? null
    }
    return before
  }

  // --- Helper: atomic event + diffs via shared RPC wrapper ---
  const logEvent = async (
    eventType: CompEventType,
    summary: string,
    diffs: { field_label: string; old_value: string | null; new_value: string | null }[]
  ) => {
    await logLeaseCompEvent(supabase, {
      leaseCompId: comp.id, teamId,
      eventType, summary, actorUserId: userId, diffs,
    })
  }

  // --- Save ---
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = buildPayload()
      const before = buildBefore()

      const { error: updateError } = await supabase
        .from('lease_comps')
        .update({ ...payload, updated_by: userId })
        .eq('id', comp.id)

      if (updateError) {
        if (isPermissionError(updateError.message)) {
          setReadOnly(true)
          setError("You don't have edit access to this comp.")
          return
        }
        throw new Error(updateError.message)
      }

      const allDiffs = computeDiffs(before, payload, FIELD_LABELS)

      if (allDiffs.length > 0) {
        // Split out lease_status change → dedicated status_changed event
        const statusDiff = allDiffs.find((d) => d.field_label === FIELD_LABELS.lease_status)
        const otherDiffs = allDiffs.filter((d) => d.field_label !== FIELD_LABELS.lease_status)

        if (statusDiff) {
          await logEvent(
            'status_changed',
            `Lease Status: ${statusDiff.old_value ?? '—'} → ${statusDiff.new_value ?? '—'}`,
            [statusDiff]
          )
        }

        if (otherDiffs.length > 0) {
          await logEvent('fields_edited', 'Lease details updated', otherDiffs)
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

  // ---------------------------------------------------------------------------
  // Reusable field components
  // ---------------------------------------------------------------------------

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    id,
    hint,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    id: string
    hint?: string
  }) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )

  const ConfidenceSelect = ({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) => (
    <div className="space-y-1">
      <Label htmlFor={id}>Confidence</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
        <option value="">—</option>
        {CONFIDENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-2">
      {readOnly && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">You don&apos;t have edit access to this comp.</p>
        </div>
      )}

      {error && !readOnly && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-xs text-green-800">Lease details saved.</p>
        </div>
      )}

      {/* Lease Type & Status */}
      <FormSection title="Lease Classification" icon={FileText}>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Lease Type" id="leaseType" value={leaseType} onChange={setLeaseType} options={LEASE_TYPE_OPTIONS} />
          <SelectField label="Lease Status" id="leaseStatus" value={leaseStatus} onChange={setLeaseStatus} options={LEASE_STATUS_OPTIONS} />
        </div>
      </FormSection>

      {/* Lease SF */}
      <FormSection title="Lease SF" icon={FileText}>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="leaseSf">Value (SF)</Label>
            <Input
              id="leaseSf"
              type="number"
              min="0"
              value={leaseSf}
              onChange={(e) => setLeaseSf(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 50,000"
            />
          </div>
          <SelectField label="Type" id="leaseSfType" value={leaseSfType} onChange={setLeaseSfType} options={LEASE_SF_TYPE_OPTIONS} />
          <ConfidenceSelect id="leaseSfConf" value={leaseSfConfidence} onChange={setLeaseSfConfidence} />
        </div>
      </FormSection>

      {/* Office SF (Lease) */}
      <FormSection title="Office SF (Lease)" icon={FileText}>
        <p className="mb-1 text-[10px] text-muted-foreground">Editing SF auto-computes %; editing % auto-computes SF. Requires Lease SF.</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label htmlFor="officeSfLease">Value (SF)</Label>
            <Input
              id="officeSfLease"
              type="number"
              min="0"
              value={officeSfLease}
              onChange={(e) => handleOfficeSfChange(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 5,000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="officePctLease">Office %</Label>
            <Input
              id="officePctLease"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={officePctLease}
              onChange={(e) => handleOfficePctChange(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 10.0"
            />
          </div>
          <SelectField label="Type" id="officeSfLeaseType" value={officeSfLeaseType} onChange={setOfficeSfLeaseType} options={OFFICE_SF_TYPE_OPTIONS} />
          <ConfidenceSelect id="officeSfConf" value={officeSfLeaseConfidence} onChange={setOfficeSfLeaseConfidence} />
        </div>
        {!leaseSf && (officeSfLease || officePctLease) && (
          <p className="mt-1 text-[10px] text-amber-600">Enter Lease SF above to enable bidirectional calculation.</p>
        )}
      </FormSection>

      {/* Dates & Term */}
      <FormSection title="Dates & Term" icon={Calendar}>
        <div className="space-y-2">
          {/* Lease Sign Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="signedDate">Lease Sign Date</Label>
              <Input id="signedDate" type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} disabled={readOnly} />
            </div>
            <ConfidenceSelect id="signedDateConf" value={signedDateConfidence} onChange={setSignedDateConfidence} />
          </div>

          {/* Lease Start Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="leaseStartDate">Lease Start Date</Label>
              <Input id="leaseStartDate" type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} disabled={readOnly} />
            </div>
            <ConfidenceSelect id="startDateConf" value={leaseStartDateConfidence} onChange={setLeaseStartDateConfidence} />
          </div>

          {/* Term (Months) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="termMonths">Term (Months)</Label>
              <Input
                id="termMonths"
                type="number"
                min="0"
                max="1200"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                disabled={readOnly}
                placeholder="e.g. 60"
              />
            </div>
            <ConfidenceSelect id="termConf" value={termMonthsConfidence} onChange={setTermMonthsConfidence} />
          </div>

          {/* Lease End Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="leaseEndDate">Lease End Date</Label>
              <div className="flex gap-1">
                <Input id="leaseEndDate" type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} disabled={readOnly} className="flex-1" />
                {canComputeEndDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleComputeEndDate}
                    title="Compute from Start Date + Term"
                  >
                    Compute
                  </Button>
                )}
              </div>
            </div>
            <ConfidenceSelect id="endDateConf" value={leaseEndDateConfidence} onChange={setLeaseEndDateConfidence} />
          </div>
        </div>
      </FormSection>

      {/* Rate & Reimbursement */}
      <FormSection title="Rate & Reimbursement" icon={DollarSign}>
        <div className="space-y-2">
          {/* Starting Rate */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="startingRate">Starting Rate</Label>
              <Input
                id="startingRate"
                type="number"
                step="0.01"
                min="0"
                value={startingRate}
                onChange={(e) => setStartingRate(e.target.value)}
                disabled={readOnly}
                placeholder="e.g. 8.50"
              />
            </div>
            <SelectField
              label="Units"
              id="startingRateUnits"
              value={startingRateUnits}
              onChange={setStartingRateUnits}
              options={RATE_UNIT_OPTIONS}
              hint="Select the rate basis for the value entered"
            />
            <ConfidenceSelect id="rateConf" value={startingRateConfidence} onChange={setStartingRateConfidence} />
          </div>

          {/* Reimbursement Method */}
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Reimbursement Method" id="reimbursementMethod" value={reimbursementMethod} onChange={setReimbursementMethod} options={REIMBURSEMENT_OPTIONS} />
          </div>

          {/* Est. Yr 1 OpEx */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="opex">Est. Yr 1 OpEx</Label>
              <Input
                id="opex"
                type="number"
                step="0.01"
                min="0"
                value={opex}
                onChange={(e) => setOpex(e.target.value)}
                disabled={readOnly}
                placeholder="e.g. 3.25"
              />
            </div>
            <SelectField label="Units" id="opexUnits" value={opexUnits} onChange={setOpexUnits} options={RATE_UNIT_OPTIONS} hint="Same unit options as Starting Rate" />
            <ConfidenceSelect id="opexConf" value={opexConfidence} onChange={setOpexConfidence} />
          </div>
        </div>
      </FormSection>

      {/* Escalations */}
      <FormSection title="Escalations" icon={TrendingUp}>
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label htmlFor="escalationValue">Value</Label>
            <Input
              id="escalationValue"
              type="number"
              step="0.01"
              min="0"
              value={escalationValue}
              onChange={(e) => setEscalationValue(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 3.0"
            />
          </div>
          <SelectField label="Units" id="escalationUnits" value={escalationUnits} onChange={setEscalationUnits} options={ESCALATION_UNIT_OPTIONS} />
          <div className="space-y-1">
            <Label htmlFor="escalationFrequency">Every ___ months</Label>
            <Input
              id="escalationFrequency"
              type="number"
              min="1"
              max="1200"
              value={escalationFrequency}
              onChange={(e) => setEscalationFrequency(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 12"
            />
          </div>
          <ConfidenceSelect id="escalationConf" value={escalationConfidence} onChange={setEscalationConfidence} />
        </div>
        {escalationPartial && (
          <p className="mt-1 text-[10px] text-amber-600">Escalations are most useful with all three: value, units, and frequency.</p>
        )}
      </FormSection>

      {/* Free Rent */}
      <FormSection title="Free Rent" icon={Gift}>
        <p className="mb-1 text-[10px] text-muted-foreground">Switching units loads the saved value for that unit type. Both values are preserved.</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="freeRentValue">Value</Label>
            <Input
              id="freeRentValue"
              type="number"
              step={freeRentUnits === 'amount' ? '0.01' : '1'}
              min="0"
              value={freeRentValue}
              onChange={(e) => setFreeRentValue(e.target.value)}
              disabled={readOnly}
              placeholder={freeRentUnits === 'amount' ? 'e.g. 50000.00' : 'e.g. 3'}
            />
          </div>
          <SelectField label="Units" id="freeRentUnits" value={freeRentUnits} onChange={(v) => {
            setFreeRentUnits(v)
            if (v === 'amount') {
              setFreeRentValue(centsToDollars(comp.free_rent_amount_cents))
            } else if (v === 'mos') {
              setFreeRentValue(comp.free_rent_months?.toString() ?? '')
            } else {
              setFreeRentValue('')
            }
          }} options={FREE_RENT_UNIT_OPTIONS} hint="Months or total dollar amount" />
          <ConfidenceSelect id="freeRentConf" value={freeRentConfidence} onChange={setFreeRentConfidence} />
        </div>
      </FormSection>

      {/* TI */}
      <FormSection title="TI" icon={Hammer}>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="tiValue">Value</Label>
            <Input
              id="tiValue"
              type="number"
              step="0.01"
              min="0"
              value={tiValue}
              onChange={(e) => setTiValue(e.target.value)}
              disabled={readOnly}
              placeholder="e.g. 25.00"
            />
          </div>
          <SelectField label="Units" id="tiUnits" value={tiUnits} onChange={setTiUnits} options={TI_UNIT_OPTIONS} hint="Per SF or total dollar amount" />
          <ConfidenceSelect id="tiConf" value={tiConfidence} onChange={setTiConfidence} />
        </div>
      </FormSection>

      {/* Comments */}
      <FormSection title="Comments" icon={MessageSquare}>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="commentsExternal">Presentation Comments (External)</Label>
            <Textarea
              id="commentsExternal"
              rows={3}
              value={commentsExternal}
              onChange={(e) => setCommentsExternal(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="commentsInternal">Presentation Comments (Internal)</Label>
            <Textarea
              id="commentsInternal"
              rows={3}
              value={commentsInternal}
              onChange={(e) => setCommentsInternal(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="miscCommentary">Misc Commentary</Label>
            <Textarea
              id="miscCommentary"
              rows={3}
              value={miscCommentary}
              onChange={(e) => setMiscCommentary(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </FormSection>

      {/* Save button — hidden in read-only mode */}
      {!readOnly && (
        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}
