import { getMe } from '@/lib/api/me'
import {
  getLeaseCompDetail,
  getTeamMembers,
} from '@/lib/api/lease-comps'
import { notFound } from 'next/navigation'
import LeaseCompDetail from './lease-comp-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaseCompDetailPage({ params }: PageProps) {
  const me = await getMe()
  if (!me) return null

  const { id } = await params

  const [comp, teamMembers] = await Promise.all([
    getLeaseCompDetail(id),
    getTeamMembers(),
  ])

  if (!comp) notFound()

  return (
    <LeaseCompDetail
      comp={comp}
      userId={me.user_id}
      teamId={me.team_id!}
      teamMembers={teamMembers}
    />
  )
}
