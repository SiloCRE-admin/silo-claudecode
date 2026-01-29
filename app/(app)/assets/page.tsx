import { getMe } from '@/lib/api/me'
import { getTeamAssets } from '@/lib/api/assets'
import Link from 'next/link'

export default async function AssetsPage() {
  // Layout ensures we have authenticated team context
  const me = await getMe()

  // me is guaranteed non-null by layout, but TypeScript doesn't know that
  if (!me) {
    // This should never happen due to layout gating, but satisfies TypeScript
    return null
  }

  const assets = await getTeamAssets()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
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

          {assets.length === 0 ? (
            /* Empty state */
            <>
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
            </>
          ) : (
            /* Assets list */
            <div className="mt-6">
              <div className="rounded-md bg-blue-50 p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{assets.length} {assets.length === 1 ? 'Asset' : 'Assets'}</span> in your portfolio
                </p>
              </div>

              <div className="space-y-3">
                {assets.map((asset) => (
                  <Link
                    key={asset.asset_id}
                    href={`/map?mode=asset_mgmt&asset_id=${asset.asset_id}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {asset.building_name || asset.building_address || 'Unnamed Building'}
                        </h3>
                        {asset.building_name && asset.building_address && (
                          <p className="mt-1 text-sm text-gray-600">{asset.building_address}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>📁 {asset.portfolio_name}</span>
                          <span>🏢 {asset.suite_count} {asset.suite_count === 1 ? 'Suite' : 'Suites'}</span>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
