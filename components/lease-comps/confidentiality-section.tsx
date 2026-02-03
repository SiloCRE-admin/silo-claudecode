'use client'

import type { LeaseCompWithBuilding } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import ConfidentialityTab from '@/app/(app)/lease-comps/[id]/tabs/confidentiality-tab'
import { Shield } from 'lucide-react'

interface ConfidentialitySectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

const EXPORT_IMPLICATIONS: Record<string, string> = {
  all_visible: 'All comp details are visible in exports and shared views.',
  hide_major_terms: 'Exports will redact: Tenant Name, Starting Rent, Effective Rent, TI Allowance, Free Rent.',
  hide_all: 'Exports will show building/SF only — all financial terms hidden.',
  excluded: 'This comp is completely excluded from all exports and shared views.',
}

const ACCESS_IMPLICATIONS: Record<string, string> = {
  all_team: 'All team members can view this comp.',
  owner_admin_me: 'Only the team owner, admins, and you can view this comp.',
  owner_me: 'Only the team owner and you can view this comp.',
  just_me: 'Only you can view this comp.',
}

export default function ConfidentialitySection({ comp, userId, teamId }: ConfidentialitySectionProps) {
  return (
    <FormSection title="Confidentiality" icon={Shield} collapsible defaultOpen={true}>
      <ConfidentialityTab comp={comp} userId={userId} teamId={teamId} />

      {/* Export implications */}
      <div className="mt-2 space-y-1 border-t border-border pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Implications
        </p>
        {comp.internal_access_level && (
          <p className="text-[10px] text-muted-foreground">
            {ACCESS_IMPLICATIONS[comp.internal_access_level] ?? ''}
          </p>
        )}
        {comp.export_detail_level && (
          <p className="text-[10px] text-muted-foreground">
            {EXPORT_IMPLICATIONS[comp.export_detail_level] ?? ''}
          </p>
        )}
      </div>
    </FormSection>
  )
}
