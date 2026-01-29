/**
 * Server-side assets API helpers
 * RLS-safe queries for team asset management
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export interface TeamAsset {
  asset_id: string
  portfolio_id: string
  portfolio_name: string
  building_id: string
  building_name: string | null
  building_address: string | null
  suite_count: number
  created_at: string
}

export interface AssetDetail {
  asset_id: string
  portfolio_name: string
  building_name: string | null
  building_address: string | null
  building_sf: number | null
  clear_height: number | null
  year_built: number | null
  suites: {
    id: string
    suite_name: string
    status: string
    square_feet: number | null
  }[]
}

/**
 * Get list of team assets with summary info
 * RLS enforces team isolation via portfolios.team_id
 */
export async function getTeamAssets(): Promise<TeamAsset[]> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Fetch assets with related data
  // RLS on portfolios enforces team_id filtering
  const { data: assets, error } = await supabase
    .from('assets')
    .select(`
      id,
      portfolio_id,
      created_at,
      building_id,
      portfolios!inner (
        name
      ),
      buildings!inner (
        name,
        full_address_raw
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team assets:', error)
    return []
  }

  if (!assets || assets.length === 0) {
    return []
  }

  // Fetch suite counts for all assets
  const assetIds = assets.map(a => a.id)
  const { data: suiteCounts } = await supabase
    .from('suites')
    .select('asset_id')
    .in('asset_id', assetIds)
    .eq('is_deleted', false)

  // Count suites per asset
  const suiteCountMap = new Map<string, number>()
  if (suiteCounts) {
    suiteCounts.forEach(s => {
      suiteCountMap.set(s.asset_id, (suiteCountMap.get(s.asset_id) || 0) + 1)
    })
  }

  // Transform to TeamAsset format
  return assets.map(asset => {
    const portfolio = asset.portfolios as unknown as { name: string } | null
    const building = asset.buildings as unknown as { name: string | null; full_address_raw: string | null } | null

    return {
      asset_id: asset.id,
      portfolio_id: asset.portfolio_id,
      portfolio_name: portfolio?.name || 'Unknown Portfolio',
      building_id: asset.building_id,
      building_name: building?.name || null,
      building_address: building?.full_address_raw || null,
      suite_count: suiteCountMap.get(asset.id) || 0,
      created_at: asset.created_at,
    }
  })
}

/**
 * Get detailed asset info including suites
 * RLS enforces team isolation via portfolios.team_id
 */
export async function getAssetDetail(assetId: string): Promise<AssetDetail | null> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Fetch asset with related data
  const { data: asset, error } = await supabase
    .from('assets')
    .select(`
      id,
      portfolios!inner (
        name
      ),
      buildings!inner (
        name,
        full_address_raw,
        building_sf,
        clear_height,
        year_built
      )
    `)
    .eq('id', assetId)
    .eq('is_deleted', false)
    .single()

  if (error || !asset) {
    return null
  }

  // Fetch suites for this asset
  const { data: suites } = await supabase
    .from('suites')
    .select('id, suite_name, status, square_feet')
    .eq('asset_id', assetId)
    .eq('is_deleted', false)
    .order('suite_name', { ascending: true })

  const portfolio = asset.portfolios as unknown as { name: string } | null
  const building = asset.buildings as unknown as {
    name: string | null
    full_address_raw: string | null
    building_sf: number | null
    clear_height: number | null
    year_built: number | null
  } | null

  return {
    asset_id: asset.id,
    portfolio_name: portfolio?.name || 'Unknown Portfolio',
    building_name: building?.name || null,
    building_address: building?.full_address_raw || null,
    building_sf: building?.building_sf || null,
    clear_height: building?.clear_height || null,
    year_built: building?.year_built || null,
    suites: suites || [],
  }
}
