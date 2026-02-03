'use client'

import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import { Label } from '@/components/ui/label'
import { LayoutList } from 'lucide-react'

interface SuiteDetailsSectionProps {
  comp: LeaseCompWithBuilding
}

/** Single read-only field row */
function DetailRow({ label, value, hint }: { label: string; value?: string | number | null; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <Label className="text-[10px] shrink-0">{label}</Label>
      {value != null && value !== '' ? (
        <span className="text-xs text-right">{value}</span>
      ) : (
        <span className="text-[10px] text-muted-foreground text-right">
          {hint ?? '—'}
        </span>
      )}
    </div>
  )
}

export default function SuiteDetailsSection({ comp }: SuiteDetailsSectionProps) {
  return (
    <FormSection title="Suite Details" icon={LayoutList}>
      <div className="divide-y divide-border">
        <DetailRow
          label="Clear Height"
          value={comp.building_clear_height ? `${comp.building_clear_height} ft (building default)` : undefined}
          hint="Requires DB support"
        />
        <DetailRow label="Dock Doors" hint="Requires DB support" />
        <DetailRow label="Drive-In Doors" hint="Requires DB support" />
        <DetailRow label="Car Parking" hint="Requires DB support" />
        <DetailRow label="Van/Box Truck Parking" hint="Requires DB support" />
        <DetailRow label="Trailer Parking" hint="Requires DB support" />
        <DetailRow label="Warehouse AC Area (SF)" hint="Requires DB support" />
        <DetailRow label="Cooler Space (SF)" hint="Requires DB support" />
        <DetailRow label="Freezer Space (SF)" hint="Requires DB support" />
        <DetailRow label="Power" hint="Requires DB support" />
        <DetailRow label="Asking Rate" hint="Requires DB support" />
        <DetailRow label="Reimbursement Method" hint="Requires DB support" />
        <DetailRow label="Date Added to Market" hint="Requires DB support" />
      </div>
    </FormSection>
  )
}
