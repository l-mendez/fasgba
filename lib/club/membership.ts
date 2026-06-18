import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { supabase } from './service-client'
import type { ClubAdmin } from './types'

/**
 * Gets all admins of a club
 */
export async function getClubAdmins(clubId: number): Promise<ClubAdmin[]> {
  const { data, error } = await supabase
    .from('club_admins')
    .select('auth_id')
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club admins:', error)
    throw new Error('Failed to fetch club admins')
  }

  // Get user details from auth.users for each admin
  const admins: ClubAdmin[] = []

  for (const item of data || []) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(item.auth_id)

    if (!userError && userData.user) {
      admins.push({
        id: item.auth_id,
        email: userData.user.email || ''
      })
    }
  }

  return admins
}

/**
 * Gets admin count for a club
 */
export async function getClubAdminCount(clubId: number): Promise<number> {
  const { count, error } = await supabase
    .from('club_admins')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club admin count:', error)
    return 0
  }

  return count || 0
}

/**
 * Checks if a user is an admin of a club
 */
export async function isUserClubAdmin(clubId: number, authId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_admins')
    .select('auth_id')
    .eq('club_id', clubId)
    .eq('auth_id', authId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * Adds a user as admin to a club
 */
export async function addClubAdmin(clubId: number, authId: string): Promise<boolean> {
  const { error } = await supabase
    .from('club_admins')
    .insert({
      club_id: clubId,
      auth_id: authId
    })

  if (error) {
    console.error('Error adding club admin:', error)
    throw new Error('Failed to add club admin')
  }

  return true
}

/**
 * Removes a user as admin from a club
 */
export async function removeClubAdmin(clubId: number, authId: string): Promise<boolean> {
  const { error } = await supabase
    .from('club_admins')
    .delete()
    .eq('club_id', clubId)
    .eq('auth_id', authId)

  if (error) {
    console.error('Error removing club admin:', error)
    throw new Error('Failed to remove club admin')
  }

  return true
}

/**
 * Gets follower count for a club
 */
export async function getClubFollowersCount(clubId: number): Promise<number> {
  const { count, error } = await supabase
    .from('user_follows_club')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club followers count:', error)
    return 0
  }

  return count || 0
}

/**
 * Checks if a user is following a club using direct database query (SERVER-SIDE)
 */
export async function isUserFollowingClubServer(clubId: number, authId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_follows_club')
      .select('auth_id')
      .eq('club_id', clubId)
      .eq('auth_id', authId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user is not following the club
        return false
      }
      console.error('Error checking follow status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isUserFollowingClubServer:', error)
    return false
  }
}

/**
 * Follows a club using API endpoint
 */
export async function followClub(clubId: number, authId: string): Promise<boolean> {
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
export async function unfollowClub(clubId: number, authId: string): Promise<boolean> {
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
