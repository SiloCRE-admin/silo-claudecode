'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CreateTeamFormProps {
  userId: string
}

export default function CreateTeamForm({ userId }: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState('')
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
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Create profile with team_owner role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          team_id: team.id,
          role: 'team_owner',
          created_by: userId,
          updated_by: userId,
        })

      if (profileError) throw profileError

      // Success - redirect to map
      router.push('/map')
      router.refresh()
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
          Team Name
        </label>
        <input
          id="team-name"
          type="text"
          required
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Acme Real Estate"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !teamName.trim()}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  )
}
