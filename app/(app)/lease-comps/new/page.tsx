import { getMe } from '@/lib/api/me'
import CreateLeaseCompForm from './create-lease-comp-form'

export default async function NewLeaseCompPage() {
  const me = await getMe()
  if (!me) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">New Lease Comp</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a building address and optional tenant name to create a new lease comparable.
          </p>

          <CreateLeaseCompForm userId={me.user_id} teamId={me.team_id!} />
        </div>
      </div>
    </div>
  )
}
