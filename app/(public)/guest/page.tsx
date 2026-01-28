import { getMe } from '@/lib/api/me'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function GuestPage() {
  const me = await getMe()

  if (!me) {
    redirect('/login')
  }

  if (!me.is_guest) {
    // Not a guest, redirect to app
    redirect('/map')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">Guest Access</h1>
          <p className="mt-4 text-gray-600">
            You are signed in as a guest user ({me.email}).
          </p>
          <p className="mt-4 text-gray-600">
            Guests have asset-scoped access to portfolios, buildings, or suites
            shared with them. You cannot access the main Silo app or comps database.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            If you need full team access, please contact your administrator or{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              sign in with a different account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
