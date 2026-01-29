import { getMe } from '@/lib/api/me'
import { notFound } from 'next/navigation'

export default async function SettingsPage() {
  // Layout ensures we have authenticated team context
  const me = await getMe()

  // me is guaranteed non-null by layout, but TypeScript doesn't know that
  if (!me) {
    // This should never happen due to layout gating, but satisfies TypeScript
    return null
  }

  // Role-specific check: team_owner or team_admin only
  if (me.role !== 'team_owner' && me.role !== 'team_admin') {
    notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-4 text-gray-600">
            Team settings and configuration.
          </p>

          <div className="mt-6 space-y-2 rounded-md bg-gray-50 p-4 font-mono text-sm">
            <div>
              <span className="font-semibold">Team ID:</span> {me.team_id}
            </div>
            <div>
              <span className="font-semibold">Role:</span> {me.role}
            </div>
          </div>

          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Access:</span> Available to team_owner and team_admin roles only.
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            This placeholder will be replaced with the actual settings interface.
          </p>
        </div>
      </div>
    </div>
  )
}
