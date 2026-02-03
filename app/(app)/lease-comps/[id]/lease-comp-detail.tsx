'use client'

import type { LeaseCompWithBuilding, TeamMember } from '@/lib/types/lease-comps'
import LeaseCompHeader from '@/components/lease-comps/lease-comp-header'
import CompletenessBanner from '@/components/lease-comps/completeness-banner'
import LeaseDetailsTab from './tabs/lease-details-tab'
import ContactsSection from '@/components/lease-comps/contacts-section'
import BuildingSection from '@/components/lease-comps/building-section'
import SuiteDetailsSection from '@/components/lease-comps/suite-details-section'
import DealLockerSection from '@/components/lease-comps/deal-locker-section'
import OptionsSection from '@/components/lease-comps/options-section'
import TasksSection from '@/components/lease-comps/tasks-section'
import RemindersSection from '@/components/lease-comps/reminders-section'
import MiscLeaseDetailsSection from '@/components/lease-comps/misc-lease-details-section'
import ConfidentialitySection from '@/components/lease-comps/confidentiality-section'
import HistorySection from '@/components/lease-comps/history-section'

interface LeaseCompDetailProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  teamMembers: TeamMember[]
}

export default function LeaseCompDetail({
  comp,
  userId,
  teamId,
  teamMembers,
}: LeaseCompDetailProps) {
  return (
    <div className="flex h-screen flex-col">
      <LeaseCompHeader comp={comp} />
      <CompletenessBanner comp={comp} />
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-3">
            {/* Column 1 — Lease Details */}
            <div className="space-y-2">
              <LeaseDetailsTab comp={comp} userId={userId} teamId={teamId} />
            </div>

            {/* Column 2 — Contacts, Building, Suite Details */}
            <div className="space-y-2">
              <ContactsSection comp={comp} />
              <BuildingSection comp={comp} userId={userId} teamId={teamId} />
              <SuiteDetailsSection comp={comp} />
            </div>

            {/* Column 3 — Collapsible sections */}
            <div className="space-y-2">
              <DealLockerSection comp={comp} userId={userId} teamId={teamId} />
              <OptionsSection comp={comp} userId={userId} teamId={teamId} />
              <TasksSection
                comp={comp}
                userId={userId}
                teamId={teamId}
                teamMembers={teamMembers}
              />
              <RemindersSection
                comp={comp}
                userId={userId}
                teamId={teamId}
                teamMembers={teamMembers}
              />
              <MiscLeaseDetailsSection />
              <ConfidentialitySection comp={comp} userId={userId} teamId={teamId} />
              <HistorySection comp={comp} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
