import { getMe } from '@/lib/api/me'
import { redirect } from 'next/navigation'
import CreateTeamForm from './create-team-form'

export default async function CreateTeamPage() {
  const me = await getMe()

  if (!me) {
    redirect('/login')
  }

  if (me.is_guest) {
    redirect('/guest')
  }

  if (me.team_id) {
    // Already has a team
    redirect('/map')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Your Team</h1>
          <p className="mt-2 text-sm text-gray-600">
            You need to create or join a team to use Silo
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <CreateTeamForm userId={me.user_id} />
        </div>
      </div>
    </div>
  )
}
