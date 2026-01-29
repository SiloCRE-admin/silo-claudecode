import { getMe } from '@/lib/api/me'
import Link from 'next/link'

export default async function AssetsPage() {
  // Layout ensures we have authenticated team context
  const me = await getMe()

  // me is guaranteed non-null by layout, but TypeScript doesn't know that
  if (!me) {
    // This should never happen due to layout gating, but satisfies TypeScript
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Assets</h1>
            <Link
              href="/assets/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Asset
            </Link>
          </div>

          {/* Empty state */}
          <div className="mt-8 text-center">
            <div className="text-6xl text-gray-300">📦</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No assets yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first property asset.
            </p>
            <Link
              href="/assets/new"
              className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create First Asset
            </Link>
          </div>

          <div className="mt-8 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Asset Management:</span> Track your portfolio properties, suites, occupancy, and leasing activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
