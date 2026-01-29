import Link from 'next/link'
import { getMe } from '@/lib/api/me'

/**
 * App navigation - role-based visibility
 *
 * Navigation items:
 * - Map: all team roles
 * - Assets: all team roles
 * - Exports: team_owner, team_admin, billing_contact
 * - Settings: team_owner, team_admin
 * - Admin: god_admin only
 */
export default async function AppNav() {
  const me = await getMe()

  // Should never be null due to layout gating, but TypeScript safety
  if (!me) {
    return null
  }

  const canViewExports = me.role === 'team_owner' || me.role === 'team_admin' || me.role === 'billing_contact'
  const canViewSettings = me.role === 'team_owner' || me.role === 'team_admin'

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/map" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              Map
            </Link>
            <Link href="/assets" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              Assets
            </Link>
            {canViewExports && (
              <Link href="/exports" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                Exports
              </Link>
            )}
            {canViewSettings && (
              <Link href="/settings" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                Settings
              </Link>
            )}
            {me.is_god_admin && (
              <Link href="/admin" className="text-sm font-medium text-red-600 hover:text-red-500">
                Admin
              </Link>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {me.email}
          </div>
        </div>
      </div>
    </nav>
  )
}
