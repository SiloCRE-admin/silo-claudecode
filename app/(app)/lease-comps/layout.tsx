import { getMe } from '@/lib/api/me'
import { notFound } from 'next/navigation'

/**
 * Lease comps layout - server-side guard
 *
 * billing_contact has NO access to lease comps.
 * RLS enforces this at the DB layer; this guard prevents
 * billing_contact from even reaching the UI (defense-in-depth).
 */
export default async function LeaseCompsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await getMe()

  if (!me || me.role === 'billing_contact') {
    notFound()
  }

  return <>{children}</>
}
