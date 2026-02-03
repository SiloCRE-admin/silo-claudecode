import { getMe } from '@/lib/api/me'
import { getTeamLeaseComps } from '@/lib/api/lease-comps'
import Link from 'next/link'

export default async function LeaseCompsPage() {
  const me = await getMe()
  if (!me) return null

  const comps = await getTeamLeaseComps()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Lease Comps</h1>
            <Link
              href="/lease-comps/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New Comp
            </Link>
          </div>

          {comps.length === 0 ? (
            <div className="mt-8 text-center">
              <h2 className="mt-4 text-xl font-semibold text-gray-900">No lease comps yet</h2>
              <p className="mt-2 text-sm text-gray-600">
                Create your first lease comparable to start tracking market data.
              </p>
              <Link
                href="/lease-comps/new"
                className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create First Comp
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <div className="rounded-md bg-blue-50 p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{comps.length} {comps.length === 1 ? 'Comp' : 'Comps'}</span>
                </p>
              </div>

              <div className="space-y-3">
                {comps.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/lease-comps/${comp.id}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {comp.tenant_name_raw || 'Unnamed Tenant'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {comp.building_name || comp.building_address || 'Unknown Building'}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className={
                            comp.status === 'draft'
                              ? 'rounded bg-yellow-100 px-2 py-0.5 text-yellow-800'
                              : 'rounded bg-green-100 px-2 py-0.5 text-green-800'
                          }>
                            {comp.status}
                          </span>
                          {comp.lease_sf && <span>{comp.lease_sf.toLocaleString()} SF</span>}
                          {comp.lease_start_date && comp.lease_end_date && (
                            <span>{comp.lease_start_date} &ndash; {comp.lease_end_date}</span>
                          )}
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
