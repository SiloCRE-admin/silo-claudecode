'use client'

import FormSection from './form-section'
import { MoreHorizontal } from 'lucide-react'

export default function MiscLeaseDetailsSection() {
  return (
    <FormSection title="Misc Lease Details" icon={MoreHorizontal} collapsible defaultOpen={false}>
      <p className="text-[10px] text-muted-foreground">
        Values not yet defined in LEASE_COMP.md; reserved section.
      </p>
      <select
        disabled
        className="mt-1 flex h-8 w-full rounded-md border border-input bg-muted px-2 py-1 text-xs opacity-50"
        multiple
      >
        <option disabled>No options available</option>
      </select>
    </FormSection>
  )
}
