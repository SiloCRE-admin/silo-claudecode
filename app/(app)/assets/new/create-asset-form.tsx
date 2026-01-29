'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CreateAssetFormProps {
  userId: string
  teamId: string
}

type SuiteStatus =
  | 'occupied_stable'
  | 'occupied_known_vacate'
  | 'occupied_renewal_likely'
  | 'occupied_renewal_unlikely'
  | 'occupied_renewal_pending'
  | 'occupied_renewal_unknown'
  | 'vacant_available'
  | 'vacant_signed_loi'
  | 'vacant_leased_not_commenced'
  | 'other_off_market'

const SUITE_STATUS_OPTIONS: { value: SuiteStatus; label: string }[] = [
  { value: 'occupied_stable', label: 'Occupied - Stable' },
  { value: 'occupied_known_vacate', label: 'Occupied - Known Vacate' },
  { value: 'occupied_renewal_likely', label: 'Occupied - Renewal Likely' },
  { value: 'occupied_renewal_unlikely', label: 'Occupied - Renewal Unlikely' },
  { value: 'occupied_renewal_pending', label: 'Occupied - Renewal Pending' },
  { value: 'occupied_renewal_unknown', label: 'Occupied - Renewal Unknown' },
  { value: 'vacant_available', label: 'Vacant - Available' },
  { value: 'vacant_signed_loi', label: 'Vacant - Signed LOI' },
  { value: 'vacant_leased_not_commenced', label: 'Vacant - Leased (Not Commenced)' },
  { value: 'other_off_market', label: 'Other / Off Market' },
]

export default function CreateAssetForm({ userId, teamId }: CreateAssetFormProps) {
  const [buildingName, setBuildingName] = useState('')
  const [address, setAddress] = useState('')
  const [portfolioName, setPortfolioName] = useState('')
  const [suiteName, setSuiteName] = useState('')
  const [squareFeet, setSquareFeet] = useState('')
  const [suiteStatus, setSuiteStatus] = useState<SuiteStatus>('other_off_market')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!address.trim()) {
        throw new Error('Address is required')
      }
      if (!suiteName.trim()) {
        throw new Error('Suite name is required')
      }

      // 1. Create building (shared layer)
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert({
          name: buildingName.trim() || null,
          full_address_raw: address.trim(),
        })
        .select()
        .single()

      if (buildingError) {
        throw new Error(`Failed to create building: ${buildingError.message}`)
      }

      // 2. Create portfolio (team-owned)
      const finalPortfolioName = portfolioName.trim() || 'Default Portfolio'
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          team_id: teamId,
          name: finalPortfolioName,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single()

      if (portfolioError) {
        throw new Error(`Failed to create portfolio: ${portfolioError.message}`)
      }

      // 3. Create asset (links portfolio + building)
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .insert({
          portfolio_id: portfolio.id,
          building_id: building.id,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single()

      if (assetError) {
        throw new Error(`Failed to create asset: ${assetError.message}`)
      }

      // 4. Create suite
      const { error: suiteError } = await supabase
        .from('suites')
        .insert({
          asset_id: asset.id,
          suite_name: suiteName.trim(),
          square_feet: squareFeet ? parseInt(squareFeet) : null,
          status: suiteStatus,
          created_by: userId,
          updated_by: userId,
        })

      if (suiteError) {
        throw new Error(`Failed to create suite: ${suiteError.message}`)
      }

      // Success - redirect to asset management map
      router.push('/map?mode=asset_mgmt')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, State 12345"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="buildingName" className="block text-sm font-medium text-gray-700">
          Building Name (Optional)
        </label>
        <input
          type="text"
          id="buildingName"
          value={buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
          placeholder="e.g., Warehouse Distribution Center"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-700">
          Portfolio Name (Optional)
        </label>
        <input
          type="text"
          id="portfolioName"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          placeholder="Defaults to 'Default Portfolio'"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          If not provided, will use &quot;Default Portfolio&quot;
        </p>
      </div>

      <div>
        <label htmlFor="suiteName" className="block text-sm font-medium text-gray-700">
          Suite Name/Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="suiteName"
          value={suiteName}
          onChange={(e) => setSuiteName(e.target.value)}
          placeholder="e.g., Suite 100 or Building A"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700">
          Square Feet (Optional)
        </label>
        <input
          type="number"
          id="squareFeet"
          value={squareFeet}
          onChange={(e) => setSquareFeet(e.target.value)}
          placeholder="e.g., 50000"
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="suiteStatus" className="block text-sm font-medium text-gray-700">
          Suite Status <span className="text-red-500">*</span>
        </label>
        <select
          id="suiteStatus"
          value={suiteStatus}
          onChange={(e) => setSuiteStatus(e.target.value as SuiteStatus)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          required
        >
          {SUITE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !address.trim() || !suiteName.trim()}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
      >
        {loading ? 'Creating Asset...' : 'Create Asset'}
      </button>
    </form>
  )
}
