'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { LeaseCompWithBuilding, LeaseCompFile } from '@/lib/types/lease-comps'
import FormSection from './form-section'
import FilesTab from '@/app/(app)/lease-comps/[id]/tabs/files-tab'
import { FileText, Loader2 } from 'lucide-react'

interface DealLockerSectionProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
}

export default function DealLockerSection({ comp, userId, teamId }: DealLockerSectionProps) {
  const [files, setFiles] = useState<LeaseCompFile[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleExpand = async () => {
    if (files !== null) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('lease_comp_files')
      .select('*')
      .eq('lease_comp_id', comp.id)
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }

  return (
    <FormSection title="Deal Locker" icon={FileText} collapsible defaultOpen={false} onExpand={handleExpand}>
      {/* Confidentiality notice */}
      <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5">
        <p className="text-[10px] text-amber-800">
          Files uploaded here are subject to the comp&apos;s confidentiality settings.
          Confidential comps will have files excluded from exports.
        </p>
      </div>

      {/* Auto-extract toggle (placeholder) */}
      <div className="mb-2 flex items-center gap-2 opacity-50">
        <input type="checkbox" disabled className="h-3 w-3" />
        <span className="text-[10px] text-muted-foreground">
          Auto-extract lease data from uploaded documents
          <span className="ml-1 italic">(Coming soon)</span>
        </span>
      </div>

      {/* File management */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {files && (
        <FilesTab comp={comp} userId={userId} teamId={teamId} files={files} />
      )}
    </FormSection>
  )
}
