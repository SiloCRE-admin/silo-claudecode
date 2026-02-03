'use client'

import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

interface BuildingSectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

export default function BuildingSection({ comp }: BuildingSectionProps) {
  const hasLocation = comp.building_latitude != null && comp.building_longitude != null

  return (
    <FormSection title="Building" icon={Building2}>
      <div className="space-y-2">
        {/* Building name */}
        <div className="space-y-0.5">
          <Label className="text-[10px]">Name</Label>
          <p className="text-xs font-medium">
            {comp.building_name || '—'}
          </p>
        </div>

        {/* Address */}
        <div className="space-y-0.5">
          <Label className="text-[10px]">Address</Label>
          <p className="text-xs">
            {comp.building_address || '—'}
          </p>
          {(comp.building_city || comp.building_state) && (
            <p className="text-[10px] text-muted-foreground">
              {[comp.building_city, comp.building_state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Location status */}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={hasLocation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
          >
            {hasLocation ? 'Location set' : 'Location not set'}
          </Badge>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Building search and map display available on the Create Comp form.
        </p>
      </div>
    </FormSection>
  )
}
