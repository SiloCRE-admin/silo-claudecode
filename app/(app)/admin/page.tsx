import { getMe } from '@/lib/api/me'
import { notFound, redirect } from 'next/navigation'

export default async function AdminPage() {
  const me = await getMe()

  if (!me) {
    redirect('/login')
  }

  if (!me.is_god_admin) {
    notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">God Admin Panel</h1>
          <p className="mt-4 text-gray-600">
            Admin interface for building moderation, markets/submarkets management.
          </p>

          <div className="mt-6 space-y-2 rounded-md bg-gray-50 p-4 font-mono text-sm">
            <div>
              <span className="font-semibold">User ID:</span> {me.user_id}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {me.email}
            </div>
            <div>
              <span className="font-semibold">God Admin:</span> {me.is_god_admin ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="mt-6 rounded-md bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> God Admins can only access:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-yellow-800">
              <li>Building layer (full CRUD)</li>
              <li>Markets and submarkets</li>
              <li>Building review queue</li>
              <li>Account metadata (teams, profiles read-only)</li>
            </ul>
            <p className="mt-2 text-sm text-yellow-800">
              God Admins <span className="font-semibold">cannot</span> access team-private business data
              (comps, CRM, documents, assets, exports, audit logs).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
