import { getMe } from '@/lib/api/me'
import { redirect } from 'next/navigation'
import AppNav from './_components/AppNav'

/**
 * App layout - enforces authenticated + team context
 *
 * Ensures all /(app) routes have:
 * - Valid session (not null)
 * - Not a guest user
 * - Has team_id (completed onboarding)
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await getMe()

  // Enforce session
  if (!me) {
    redirect('/login')
  }

  // Enforce non-guest
  if (me.is_guest) {
    redirect('/guest')
  }

  // Enforce team membership
  if (!me.team_id) {
    redirect('/create-team')
  }

  // User has valid team context - render nav + children
  return (
    <>
      <AppNav />
      {children}
    </>
  )
}
