import { deleteClubImages } from '@/lib/imageUtils.server'
import { supabase } from './service-client'
import { getClubAdminCount, getClubFollowersCount } from './membership'
import { getClubNewsCount } from './content'
import type { Club, ClubWithFollowState, ClubWithStats } from './types'

/**
 * Gets all clubs with optional filtering
 */
export async function getAllClubs(options: {
  search?: string
  hasContact?: boolean
  includeStats?: boolean
} = {}): Promise<Club[] | ClubWithStats[]> {
  try {
    let query = supabase.from('clubs').select('*')

    if (options.search) {
      query = query.ilike('name', `%${options.search}%`)
    }

    if (options.hasContact) {
      query = query.not('mail', 'is', null)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clubs:', error)
      throw new Error('Failed to fetch clubs')
    }

    if (!options.includeStats) {
      return data || []
    }

    // Add stats if requested
    const clubsWithStats = await Promise.all((data || []).map(async (club) => {
      const [adminCount, newsCount] = await Promise.all([
        getClubAdminCount(club.id),
        getClubNewsCount(club.id)
      ])

      return {
        ...club,
        adminCount,
        newsCount
      }
    }))

    return clubsWithStats
  } catch (error) {
    console.error('Error in getAllClubs:', error)
    throw error
  }
}

/**
 * Search clubs by name
 * @param searchTerm - The search term to match against club names
 * @returns Promise<Club[]> - Array of clubs matching the search term
 */
export async function searchClubsByName(searchTerm: string): Promise<Club[]> {
  try {
    return await getAllClubs({ search: searchTerm }) as Club[]
  } catch (error) {
    console.error('Error searching clubs by name:', error)
    throw error
  }
}

/**
 * Gets a club by ID
 */
export async function getClubById(clubId: number, includeStats = false): Promise<Club | ClubWithStats | null> {
  const { data: club, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Club not found
    }
    console.error('Error fetching club:', error)
    throw new Error('Failed to fetch club')
  }

  if (!includeStats) {
    return club
  }

  const [adminCount, followersCount, newsCount] = await Promise.all([
    getClubAdminCount(clubId),
    getClubFollowersCount(clubId),
    getClubNewsCount(clubId)
  ])

  return {
    ...club,
    adminCount,
    followersCount,
    newsCount
  }
}

/**
 * Creates a new club
 */
export async function createClub(clubData: Omit<Club, 'id'>): Promise<Club> {
  const { data, error } = await supabase
    .from('clubs')
    .insert(clubData)
    .select()
    .single()

  if (error) {
    console.error('Error creating club:', error)
    throw new Error('Failed to create club')
  }

  return data
}

/**
 * Updates a club
 */
export async function updateClub(clubId: number, updates: Partial<Omit<Club, 'id'>>): Promise<boolean> {
  const { error } = await supabase
    .from('clubs')
    .update(updates)
    .eq('id', clubId)

  if (error) {
    console.error('Error updating club:', error)
    throw new Error('Failed to update club')
  }

  return true
}

/**
 * Deletes a club
 */
export async function deleteClub(clubId: number): Promise<boolean> {
  const { error } = await supabase
    .from('clubs')
    .delete()
    .eq('id', clubId)

  if (error) {
    console.error('Error deleting club:', error)
    throw new Error('Failed to delete club')
  }

  await deleteClubImages(clubId)

  return true
}

/**
 * Gets clubs administered by a specific user (by auth UUID)
 */
export async function getUserAdminClubs(authId: string): Promise<Club[]> {
  try {
    // Get club IDs where the user is an admin
    const { data: adminRelations, error: adminError } = await supabase
      .from('club_admins')
      .select('club_id')
      .eq('auth_id', authId)

    if (adminError) {
      console.error('Error fetching user admin relations:', adminError)
      throw new Error('Failed to fetch user admin clubs')
    }

    if (!adminRelations || adminRelations.length === 0) {
      return []
    }

    // Get the actual club data
    const clubIds = adminRelations.map(relation => relation.club_id)
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .in('id', clubIds)

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError)
      throw new Error('Failed to fetch clubs')
    }

    return clubs || []
  } catch (error) {
    console.error('Error in getUserAdminClubs:', error)
    throw error
  }
}

/**
 * Gets clubs followed by a specific user (by auth UUID)
 */
export async function getUserFollowedClubs(authId: string): Promise<Club[]> {
  try {
    // Get club IDs that the user follows
    const { data: followRelations, error: followError } = await supabase
      .from('user_follows_club')
      .select('club_id')
      .eq('auth_id', authId)

    if (followError) {
      console.error('Error fetching user follow relations:', followError)
      throw new Error('Failed to fetch user followed clubs')
    }

    if (!followRelations || followRelations.length === 0) {
      return []
    }

    // Get the actual club data
    const clubIds = followRelations.map(relation => relation.club_id)
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .in('id', clubIds)

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError)
      throw new Error('Failed to fetch clubs')
    }

    return clubs || []
  } catch (error) {
    console.error('Error in getUserFollowedClubs:', error)
    throw error
  }
}

/**
 * Server-side function to get clubs with follow status for a specific user
 * Used for SSR
 */
export async function getClubsWithFollowStatus(
  authId: string | null,
  searchTerm?: string
): Promise<ClubWithFollowState[]> {
  try {
    const clubsData = searchTerm ?
      await searchClubsByName(searchTerm) :
      await getAllClubs()

    if (!authId) {
      // If no user, return clubs with isFollowing: false
      return clubsData.map(club => ({ ...club, isFollowing: false }))
    }

    // Get all clubs the user follows
    const { data: followRelations, error } = await supabase
      .from('user_follows_club')
      .select('club_id')
      .eq('auth_id', authId)

    if (error) {
      console.error('Error fetching follow relations:', error)
      return clubsData.map(club => ({ ...club, isFollowing: false }))
    }

    const followedClubIds = new Set(followRelations?.map(r => r.club_id) || [])

    return clubsData.map(club => ({
      ...club,
      isFollowing: followedClubIds.has(club.id)
    }))
  } catch (error) {
    console.error('Error in getClubsWithFollowStatus:', error)
    throw error
  }
}
