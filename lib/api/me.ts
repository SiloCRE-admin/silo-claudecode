/**
 * Server-side "me context" function for auth/team/role resolution
 *
 * Returns current user's context including:
 * - user_id
 * - team_id (null if guest or god_admin)
 * - role (team role or null)
 * - is_guest (true if in guest_users table)
 * - is_god_admin (true if JWT app_metadata.role = 'god_admin')
 *
 * RLS-safe: uses authenticated context, no service role
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export type UserRole = 'team_owner' | 'team_admin' | 'team_member' | 'billing_contact'

export interface MeContext {
  user_id: string
  email: string | null
  team_id: string | null
  role: UserRole | null
  is_guest: boolean
  is_god_admin: boolean
}

/**
 * Get current user context from database
 * Returns null if not authenticated
 */
export async function getMe(): Promise<MeContext | null> {
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Check if god_admin via JWT app_metadata
  const isGodAdmin = user.app_metadata?.role === 'god_admin'

  // Check profiles table for team membership
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id, role, email')
    .eq('user_id', user.id)
    .single()

  // Check guest_users table
  const { data: guestUser } = await supabase
    .from('guest_users')
    .select('email')
    .eq('user_id', user.id)
    .single()

  const isGuest = !!guestUser

  return {
    user_id: user.id,
    email: profile?.email || guestUser?.email || user.email || null,
    team_id: profile?.team_id || null,
    role: profile?.role as UserRole || null,
    is_guest: isGuest,
    is_god_admin: isGodAdmin,
  }
}
