import { getMe } from '@/lib/api/me'
import Link from 'next/link'

/**
 * Debug page for inspecting user context
 */
export default async function MePage() {
  const me = await getMe()

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow">
          <p className="text-gray-600">Not logged in</p>
          <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">Me Context (Debug)</h1>

          <div className="mt-6 space-y-3 font-mono text-sm">
            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">user_id:</span>
              <span className="col-span-2 break-all">{me.user_id}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">email:</span>
              <span className="col-span-2">{me.email || 'null'}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">team_id:</span>
              <span className="col-span-2 break-all">{me.team_id || 'null'}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">role:</span>
              <span className="col-span-2">{me.role || 'null'}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">is_guest:</span>
              <span className="col-span-2">{String(me.is_guest)}</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <span className="font-semibold">is_god_admin:</span>
              <span className="col-span-2">{String(me.is_god_admin)}</span>
            </div>
          </div>

          <div className="mt-6 space-x-4">
            <Link href="/map" className="text-blue-600 hover:underline">
              Go to /map
            </Link>
            <Link href="/admin" className="text-blue-600 hover:underline">
              Go to /admin
            </Link>
            <Link href="/guest" className="text-blue-600 hover:underline">
              Go to /guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
