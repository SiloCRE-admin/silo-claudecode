'use client'

import Link from 'next/link'
import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import { deriveIncompleteReasons } from './completeness-banner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Save } from 'lucide-react'

interface LeaseCompHeaderProps {
  comp: LeaseCompWithBuilding
  saving?: boolean
  onSave?: () => void
}

export default function LeaseCompHeader({ comp, saving, onSave }: LeaseCompHeaderProps) {
  const incompleteReasons = deriveIncompleteReasons(comp)
  const isComplete = incompleteReasons.length === 0

  return (
    <div className="sticky top-0 z-10 border-b bg-card px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/lease-comps"
            className="flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              {comp.tenant_name_raw || 'Unnamed Tenant'}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {comp.building_name || comp.building_address || 'Unknown Building'}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              comp.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }
          >
            {comp.status}
          </Badge>
          {isComplete ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Incomplete
              <span className="ml-1">({incompleteReasons.length})</span>
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              {saving ? 'Saving…' : 'Saved'}
            </span>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
