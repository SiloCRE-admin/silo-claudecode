'use client'

import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users } from 'lucide-react'

interface ContactsSectionProps {
  comp: LeaseCompWithBuilding
}

export default function ContactsSection({ comp }: ContactsSectionProps) {
  return (
    <FormSection title="Contacts" icon={Users}>
      <div className="space-y-1">
        <Label>Tenant Name</Label>
        <Input
          value={comp.tenant_name_raw ?? ''}
          disabled
          className="bg-muted"
        />
        <p className="text-[10px] text-muted-foreground">
          Edit tenant name in Lease Details. CRM contact linking requires a future migration.
        </p>
      </div>
    </FormSection>
  )
}
