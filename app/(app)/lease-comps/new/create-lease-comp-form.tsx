'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AddressAutocomplete, { type PlaceData } from '@/components/address-autocomplete'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

interface CreateLeaseCompFormProps {
  userId: string
  teamId: string
}

export default function CreateLeaseCompForm({ userId, teamId }: CreateLeaseCompFormProps) {
  const [address, setAddress] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placeData, setPlaceData] = useState<PlaceData | null>(null)
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
      if (!address.trim()) {
        throw new Error('Address is required')
      }

      // 1. Find or create building via RPC (bypasses god_admin-only INSERT policy)
      const addressTrimmed = address.trim()

      const { data: buildingId, error: buildingError } = await supabase
        .rpc('find_or_create_building', { p_full_address_raw: addressTrimmed })

      if (buildingError || !buildingId) {
        throw new Error(`Failed to create building: ${buildingError?.message || 'no building ID returned'}`)
      }

      if (placeData) {
        console.log('[CreateLeaseCompForm] Place data:', placeData)
      }

      // 2. Insert lease comp (draft)
      const { data: comp, error: compError } = await supabase
        .from('lease_comps')
        .insert({
          team_id: teamId,
          building_id: buildingId,
          status: 'draft',
          tenant_name_raw: tenantName.trim() || null,
          created_by: userId,
          updated_by: userId,
        })
        .select('id')
        .single()

      if (compError) {
        throw new Error(`Failed to create lease comp: ${compError.message}`)
      }

      // 3. Upsert team_building_presence (map privacy — non-blocking)
      const { error: presenceError } = await supabase
        .from('team_building_presence')
        .upsert(
          { team_id: teamId, building_id: buildingId, created_at: new Date().toISOString() },
          { onConflict: 'team_id,building_id', ignoreDuplicates: true }
        )

      if (presenceError) {
        console.error('Failed to upsert team_building_presence:', presenceError)
      }

      // 4. Log comp_created event atomically (non-blocking)
      try {
        await logLeaseCompEvent(supabase, {
          leaseCompId: comp.id,
          teamId,
          eventType: 'comp_created',
          summary: tenantName.trim()
            ? `Comp created for "${tenantName.trim()}" at ${addressTrimmed}`
            : `Comp created at ${addressTrimmed}`,
          actorUserId: userId,
        })
      } catch (err) {
        console.error('Failed to log comp_created event:', err)
      }

      // 5. Redirect to detail page
      router.push(`/lease-comps/${comp.id}`)
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
          Building Address <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          id="address"
          value={address}
          onChange={setAddress}
          onPlaceSelect={(place) => setPlaceData(place)}
          placeholder="123 Main St, City, State 12345"
          required
        />
      </div>

      <div>
        <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
          Tenant Name (Optional)
        </label>
        <input
          type="text"
          id="tenantName"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="e.g., Acme Corp"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !address.trim()}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Lease Comp'}
      </button>
    </form>
  )
}
