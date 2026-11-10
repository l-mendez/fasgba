// Browser-safe club follow helpers. Kept out of membership.ts so client
// components never import the service-role client.
import { createClient as createBrowserClient } from '@/lib/supabase/client'

// authId is kept for caller compatibility; the API identifies the user from the session token.
type FollowAction = (clubId: number, authId: string) => Promise<boolean>

/**
 * Follows a club using API endpoint
 */
export const followClub: FollowAction = async (clubId) => {
  try {
    // Get authentication token from client-side Supabase
    const clientSupabase = createBrowserClient()
    const { data: { session } } = await clientSupabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`/api/clubs/${clubId}/followers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error following club:', error)
    throw error
  }
}

/**
 * Unfollows a club using API endpoint
 */
export const unfollowClub: FollowAction = async (clubId) => {
  try {
    // Get authentication token from client-side Supabase
    const clientSupabase = createBrowserClient()
    const { data: { session } } = await clientSupabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`/api/clubs/${clubId}/followers`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error unfollowing club:', error)
    throw error
  }
}
