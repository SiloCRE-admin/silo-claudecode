import { getMe } from '@/lib/api/me'
import CreateAssetForm from './create-asset-form'

export default async function NewAssetPage() {
  // Layout ensures we have authenticated team context
  const me = await getMe()

  // me is guaranteed non-null by layout, but TypeScript doesn't know that
  if (!me) {
    // This should never happen due to layout gating, but satisfies TypeScript
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">Create First Asset</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add your first property to start managing your portfolio.
          </p>

          <CreateAssetForm userId={me.user_id} teamId={me.team_id!} />
        </div>
      </div>
    </div>
  )
}
