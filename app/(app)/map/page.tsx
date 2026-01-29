import { getMe } from '@/lib/api/me'
import { getTeamAssets, getAssetDetail, type AssetDetail } from '@/lib/api/assets'
import Link from 'next/link'

type MapMode = 'market_intel' | 'asset_mgmt'

interface MapPageProps {
  searchParams: Promise<{ mode?: string; asset_id?: string }>
}

export default async function MapPage({ searchParams }: MapPageProps) {
  // Layout ensures we have authenticated team context
  const me = await getMe()

  // me is guaranteed non-null by layout, but TypeScript doesn't know that
  if (!me) {
    // This should never happen due to layout gating, but satisfies TypeScript
    return null
  }

  const params = await searchParams
  const mode: MapMode = params.mode === 'asset_mgmt' ? 'asset_mgmt' : 'market_intel'
  const selectedAssetId = params.asset_id

  // Fetch assets only in asset_mgmt mode
  const assets = mode === 'asset_mgmt' ? await getTeamAssets() : []

  // Fetch selected asset detail if asset_id is provided
  const assetDetail = selectedAssetId ? await getAssetDetail(selectedAssetId) : null

  return (
    <div className="flex h-screen flex-col">
      {/* Mode Toggle */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mode:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Link
              href="/map?mode=market_intel"
              className={`px-4 py-2 text-sm font-medium border ${
                mode === 'market_intel'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-md`}
            >
              Market Intelligence
            </Link>
            <Link
              href="/map?mode=asset_mgmt"
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                mode === 'asset_mgmt'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-md`}
            >
              Asset Management
            </Link>
          </div>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: List */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'market_intel' ? 'Buildings' : 'Portfolio Assets'}
            </h2>
            <div className="mt-4 space-y-2">
              {mode === 'asset_mgmt' ? (
                assets.length > 0 ? (
                  assets.map((asset) => (
                    <Link
                      key={asset.asset_id}
                      href={`/map?mode=asset_mgmt&asset_id=${asset.asset_id}`}
                      className={`block rounded border p-3 text-sm transition-colors ${
                        selectedAssetId === asset.asset_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {asset.building_name || asset.building_address || 'Unnamed Building'}
                      </div>
                      {asset.building_name && asset.building_address && (
                        <div className="mt-1 text-xs text-gray-500 truncate">
                          {asset.building_address}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {asset.suite_count} {asset.suite_count === 1 ? 'suite' : 'suites'}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-sm text-gray-500">No assets yet</p>
                    <Link
                      href="/assets/new"
                      className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700"
                    >
                      Create your first asset
                    </Link>
                  </div>
                )
              ) : (
                <div className="rounded border border-gray-200 p-3 text-sm text-gray-500">
                  List placeholder - buildings will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Map Canvas */}
        <div className="flex-1 bg-gray-100">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-6xl text-gray-300">🗺️</div>
              <p className="mt-4 text-sm text-gray-500">
                Map canvas placeholder (Mapbox will be added later)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Pin Detail Card */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          {mode === 'market_intel' ? (
            <MarketIntelPinCard />
          ) : (
            <AssetMgmtPinCard assetDetail={assetDetail} />
          )}
        </div>
      </div>
    </div>
  )
}

function MarketIntelPinCard() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900">Market Intelligence</h2>
      <p className="mt-1 text-xs text-gray-500">Pin detail card placeholder</p>

      <div className="mt-4 space-y-4">
        {/* Building Info */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Building Info</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>{' '}
              <span className="text-gray-900">[Building Name]</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Address:</span>{' '}
              <span className="text-gray-900">[Address]</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Owner:</span>{' '}
              <span className="text-gray-900">[Owner]</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Building SF:</span>{' '}
              <span className="text-gray-900">[SF]</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Clear Height:</span>{' '}
              <span className="text-gray-900">[Height]</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Year Built:</span>{' '}
              <span className="text-gray-900">[Year]</span>
            </div>
          </div>
        </section>

        {/* Lease Comps */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Lease Comps</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-600">Total Comps:</span>{' '}
              <span className="text-gray-900">[Count]</span>
            </div>
            <div className="mt-2 rounded bg-gray-50 p-2">
              <div className="text-xs font-medium text-gray-500">Most Recent</div>
              <div className="mt-1 text-sm text-gray-900">[Lease comp details]</div>
            </div>
          </div>
        </section>

        {/* Sale Comps */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Sale Comps</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-600">Total Comps:</span>{' '}
              <span className="text-gray-900">[Count]</span>
            </div>
            <div className="mt-2 rounded bg-gray-50 p-2">
              <div className="text-xs font-medium text-gray-500">Most Recent</div>
              <div className="mt-1 text-sm text-gray-900">[Sale comp details]</div>
            </div>
          </div>
        </section>

        {/* Market Chatter */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Market Chatter</h3>
          <div className="mt-2 text-sm">
            <span className="font-medium text-gray-600">Count:</span>{' '}
            <span className="text-gray-900">[Count]</span>
          </div>
        </section>

        {/* Land Comps */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Land Comps</h3>
          <div className="mt-2 text-sm text-gray-500">[Land comp data]</div>
        </section>

        {/* Quick Actions */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
          <div className="mt-2 space-y-2">
            <button className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Comp
            </button>
            <button className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add Chatter
            </button>
            <button className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export Details
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function AssetMgmtPinCard({ assetDetail }: { assetDetail: AssetDetail | null }) {
  if (!assetDetail) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">Asset Management</h2>
        <div className="mt-8 text-center">
          <div className="text-6xl text-gray-300">📍</div>
          <p className="mt-4 text-sm text-gray-500">
            Select an asset from the list to view details
          </p>
        </div>
      </div>
    )
  }

  // Format suite status for display
  const formatSuiteStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const topSuites = assetDetail.suites.slice(0, 3)

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900">Asset Management</h2>
      <p className="mt-1 text-xs text-gray-500">
        {assetDetail.building_name || assetDetail.building_address || 'Asset Details'}
      </p>

      <div className="mt-4 space-y-4">
        {/* Building Info */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Building Info</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>{' '}
              <span className="text-gray-900">{assetDetail.building_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Address:</span>{' '}
              <span className="text-gray-900">{assetDetail.building_address || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Portfolio:</span>{' '}
              <span className="text-gray-900">{assetDetail.portfolio_name}</span>
            </div>
            {assetDetail.building_sf && (
              <div>
                <span className="font-medium text-gray-600">Building SF:</span>{' '}
                <span className="text-gray-900">{assetDetail.building_sf.toLocaleString()}</span>
              </div>
            )}
            {assetDetail.clear_height && (
              <div>
                <span className="font-medium text-gray-600">Clear Height:</span>{' '}
                <span className="text-gray-900">{assetDetail.clear_height} ft</span>
              </div>
            )}
            {assetDetail.year_built && (
              <div>
                <span className="font-medium text-gray-600">Year Built:</span>{' '}
                <span className="text-gray-900">{assetDetail.year_built}</span>
              </div>
            )}
          </div>
        </section>

        {/* Suite Summary */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Suites</h3>
          <div className="mt-2 text-sm">
            <span className="font-medium text-gray-600">Total:</span>{' '}
            <span className="text-gray-900">{assetDetail.suites.length}</span>
          </div>
        </section>

        {/* Top 3 Suites */}
        {topSuites.length > 0 && (
          <section className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {assetDetail.suites.length <= 3 ? 'All Suites' : 'Top 3 Suites'}
            </h3>
            <div className="mt-2 space-y-2">
              {topSuites.map((suite, index) => (
                <div key={suite.id} className="rounded bg-gray-50 p-2 text-sm">
                  <div className="font-medium text-gray-900">
                    {index + 1}. {suite.suite_name}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {formatSuiteStatus(suite.status)}
                    {suite.square_feet && (
                      <span className="ml-2">• {suite.square_feet.toLocaleString()} SF</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
          <div className="mt-2 space-y-2">
            <button className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              View Full Details
            </button>
            <button className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add Suite
            </button>
            <button className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export Report
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
