'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type {
  LeaseCompWithBuilding,
  RenewalOption,
  TerminationOption,
  ExpansionOption,
  PurchaseOption,
} from '@/lib/types/lease-comps'
import FormSection from './form-section'
import OptionsTab from '@/app/(app)/lease-comps/[id]/tabs/options-tab'
import { ListChecks, Loader2 } from 'lucide-react'

interface OptionsSectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

interface OptionsData {
  renewalOptions: RenewalOption[]
  terminationOptions: TerminationOption[]
  expansionOptions: ExpansionOption[]
  purchaseOptions: PurchaseOption[]
}

export default function OptionsSection({ comp, userId, teamId }: OptionsSectionProps) {
  const [data, setData] = useState<OptionsData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (data !== null) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const [r, t, e, p] = await Promise.all([
      supabase.from('lease_comp_renewal_options').select('*').eq('lease_comp_id', comp.id).order('option_number'),
      supabase.from('lease_comp_termination_options').select('*').eq('lease_comp_id', comp.id).order('option_number'),
      supabase.from('lease_comp_expansion_options').select('*').eq('lease_comp_id', comp.id).order('option_number'),
      supabase.from('lease_comp_purchase_options').select('*').eq('lease_comp_id', comp.id).order('option_number'),
    ])
    setData({
      renewalOptions: (r.data ?? []) as RenewalOption[],
      terminationOptions: (t.data ?? []) as TerminationOption[],
      expansionOptions: (e.data ?? []) as ExpansionOption[],
      purchaseOptions: (p.data ?? []) as PurchaseOption[],
    })
    setLoading(false)
  }

  return (
    <FormSection title="Options" icon={ListChecks} collapsible defaultOpen={false} onExpand={handleExpand}>
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {data && (
        <OptionsTab
          comp={comp}
          userId={userId}
          teamId={teamId}
          renewalOptions={data.renewalOptions}
          terminationOptions={data.terminationOptions}
          expansionOptions={data.expansionOptions}
          purchaseOptions={data.purchaseOptions}
        />
      )}
    </FormSection>
  )
}
