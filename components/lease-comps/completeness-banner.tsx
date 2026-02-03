'use client'

import { useState } from 'react'
import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

const REASON_LABELS: Record<string, string> = {
  missing_tenant: 'Missing tenant name',
  missing_building: 'Missing building/address',
  missing_lease_sf: 'Missing lease SF',
  missing_start_date: 'Missing lease start date',
  missing_term: 'Missing lease term',
  missing_pricing: 'Missing rent pricing',
  missing_reimbursement: 'Missing reimbursement method',
  missing_reimbursement_notes: "Missing reimbursement notes (required when 'other')",
}

/**
 * Derive completeness from existing comp fields (no DB columns required).
 * Returns a list of reason codes; empty list = complete.
 */
export function deriveIncompleteReasons(comp: LeaseCompWithBuilding): string[] {
  const reasons: string[] = []

  if (!comp.tenant_name_raw?.trim()) {
    reasons.push('missing_tenant')
  }
  if (!comp.building_id) {
    reasons.push('missing_building')
  }
  if (comp.lease_sf == null) {
    reasons.push('missing_lease_sf')
  }
  if (!comp.lease_start_date) {
    reasons.push('missing_start_date')
  }
  if (comp.lease_term_months == null && !comp.lease_end_date) {
    reasons.push('missing_term')
  }
  if (comp.rent_psf_cents == null) {
    reasons.push('missing_pricing')
  }
  if (!comp.reimbursement_method) {
    reasons.push('missing_reimbursement')
  }
  if (
    comp.reimbursement_method === 'other' &&
    (!comp.reimbursement_other_notes ||
      comp.reimbursement_other_notes.trim().length < 10)
  ) {
    reasons.push('missing_reimbursement_notes')
  }

  return reasons
}

interface CompletenessBannerProps {
  comp: LeaseCompWithBuilding
}

export default function CompletenessBanner({ comp }: CompletenessBannerProps) {
  const reasons = deriveIncompleteReasons(comp)
  const isComplete = reasons.length === 0
  const [expanded, setExpanded] = useState(false)

  if (isComplete) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-1.5">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Complete
        </Badge>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-1.5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-amber-600" />
          ) : (
            <ChevronRight className="h-3 w-3 text-amber-600" />
          )}
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Incomplete ({reasons.length})
          </Badge>
          {!expanded && reasons.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {REASON_LABELS[reasons[0]] ?? reasons[0]}
              {reasons.length > 1 && ` +${reasons.length - 1} more`}
            </span>
          )}
        </div>

        {expanded && reasons.length > 0 && (
          <ul className="mt-2 space-y-0.5 pl-5">
            {reasons.map((r) => (
              <li key={r} className="text-[10px] text-amber-800">
                {REASON_LABELS[r] ?? r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
