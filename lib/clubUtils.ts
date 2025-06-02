import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Basic club information
export interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

// Club with additional statistics
export interface ClubWithStats extends Club {
  memberCount: number
  adminCount: number
  followersCount: number
  newsCount: number
}

// Club member information (now just from auth.users)
export interface ClubMember {
  id: string // auth UUID
  email: string
  // Additional profile info would come from user_metadata if needed
}

// Club admin information (now just from auth.users)
export interface ClubAdmin {
  id: string // auth UUID
  email: string
}

// Club news information
export interface ClubNews {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[]
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
  author_name?: string
  author_email?: string
}

// Interface for date filtering options
export interface DateFilterOptions {
  startDate?: string  // YYYY-MM-DD format
  endDate?: string    // YYYY-MM-DD format
}

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
      const [memberCount, adminCount, newsCount] = await Promise.all([
        getClubMemberCount(club.id),
        getClubAdminCount(club.id),
        getClubNewsCount(club.id)
      ])
      
      return {
        ...club,
        memberCount,
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

  const [memberCount, adminCount, followersCount, newsCount] = await Promise.all([
    getClubMemberCount(clubId),
    getClubAdminCount(clubId),
    getClubFollowersCount(clubId),
    getClubNewsCount(clubId)
  ])

  return {
    ...club,
    memberCount,
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

  return true
}

/**
 * Gets all members of a club (currently returns empty array since we don't have a members relationship)
 */
export async function getClubMembers(clubId: number): Promise<ClubMember[]> {
  // For now, return empty array since we don't have a members table
  // This would need to be implemented if there's a specific membership system
  return []
}

/**
 * Gets member count for a club
 */
export async function getClubMemberCount(clubId: number): Promise<number> {
  // For now, return 0 since we don't have a members table
  // This would need to be implemented if there's a specific membership system
  return 0
}

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
 * Checks if a user is following a club using API endpoint
 */
export async function isUserFollowingClub(clubId: number, authId: string): Promise<boolean> {
  try {
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    
    if (!token) {
      console.warn('No authentication token available for checking follow status')
      return false
    }

    const response = await fetch(`/api/clubs/${clubId}/followers/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('User not authenticated for follow status check')
        return false
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.isFollowing || false
  } catch (error) {
    console.error('Error checking if user is following club:', error)
    return false
  }
}

/**
 * Follows a club using API endpoint
 */
export async function followClub(clubId: number, authId: string): Promise<boolean> {
  try {
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
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
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
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

/**
 * Gets news from a club
 */
export async function getClubNews(clubId: number, limit?: number): Promise<ClubNews[]> {
  let query = supabase
    .from('news')
    .select('*')
    .eq('club_id', clubId)
    .order('date', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching club news:', error)
    throw new Error('Failed to fetch club news')
  }

  // Fetch author information for each news item
  const newsWithAuthors = await Promise.all(
    (data || []).map(async (item) => {
      let author_email = undefined
      let author_name = undefined

      if (item.created_by_auth_id) {
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(item.created_by_auth_id)
          
          if (!userError && userData.user) {
            author_email = userData.user.email || undefined
            // You can also get the name from user_metadata if it exists
            author_name = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || undefined
          }
        } catch (error) {
          console.warn(`Could not fetch author info for news ${item.id}:`, error)
        }
      }

      return {
        ...item,
        tags: item.tags || [],
        author_email,
        author_name
      }
    })
  )

  return newsWithAuthors
}

/**
 * Gets news count for a club with optional date filtering
 */
export async function getClubNewsCount(clubId: number, options: DateFilterOptions = {}): Promise<number> {
  let query = supabase
    .from('news')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  // Apply date filters if provided
  if (options.startDate) {
    query = query.gte('date', options.startDate)
  }

  if (options.endDate) {
    query = query.lte('date', options.endDate)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching club news count:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets tournament count for a club with optional date filtering
 */
export async function getClubTournamentCount(clubId: number, options: DateFilterOptions = {}): Promise<number> {
  let query = supabase
    .from('tournaments')
    .select('id', { count: 'exact', head: true })
    .eq('created_by_club_id', clubId)

  // If date filters are provided, we need to join with tournamentdates and filter
  if (options.startDate || options.endDate) {
    // For date filtering, we need to find tournaments where their date range overlaps with the specified range
    // This means: tournament's earliest date <= endDate AND tournament's latest date >= startDate
    
    let tournamentIdsQuery = supabase
      .from('tournaments')
      .select(`
        id,
        tournament_dates:tournamentdates(event_date)
      `)
      .eq('created_by_club_id', clubId)

    const { data: tournamentsWithDates, error: tournamentError } = await tournamentIdsQuery

    if (tournamentError) {
      console.error('Error fetching tournaments with dates:', tournamentError)
      return 0
    }

    if (!tournamentsWithDates || tournamentsWithDates.length === 0) {
      return 0
    }

    // Filter tournaments based on date range overlap
    const filteredTournamentIds = tournamentsWithDates
      .filter(tournament => {
        const dates = tournament.tournament_dates.map((d: any) => d.event_date).sort()
        if (dates.length === 0) return false

        const earliestDate = dates[0]
        const latestDate = dates[dates.length - 1]

        // Check if tournament date range overlaps with filter range
        let overlaps = true

        if (options.endDate && earliestDate > options.endDate) {
          overlaps = false
        }

        if (options.startDate && latestDate < options.startDate) {
          overlaps = false
        }

        return overlaps
      })
      .map(tournament => tournament.id)

    return filteredTournamentIds.length
  }

  // If no date filters, just count directly
  const { count, error } = await query

  if (error) {
    console.error('Error fetching club tournament count:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets tournaments created by a club with optional date filtering
 */
export async function getClubTournaments(clubId: number, options: DateFilterOptions & { limit?: number } = {}): Promise<any[]> {
  // If date filters are provided, we need to join with tournamentdates and filter
  if (options.startDate || options.endDate) {
    // For date filtering, we need to find tournaments where their date range overlaps with the specified range
    let tournamentIdsQuery = supabase
      .from('tournaments')
      .select(`
        *,
        tournament_dates:tournamentdates(
          id,
          tournament_id,
          event_date
        )
      `)
      .eq('created_by_club_id', clubId)
      .order('id', { ascending: false })

    const { data: tournamentsWithDates, error: tournamentError } = await tournamentIdsQuery

    if (tournamentError) {
      console.error('Error fetching tournaments with dates:', tournamentError)
      throw new Error('Failed to fetch club tournaments')
    }

    if (!tournamentsWithDates || tournamentsWithDates.length === 0) {
      return []
    }

    // Filter tournaments based on date range overlap
    const filteredTournaments = tournamentsWithDates
      .filter(tournament => {
        const dates = tournament.tournament_dates.map((d: any) => d.event_date).sort()
        if (dates.length === 0) return false

        const earliestDate = dates[0]
        const latestDate = dates[dates.length - 1]

        // Check if tournament date range overlaps with filter range
        let overlaps = true

        if (options.endDate && earliestDate > options.endDate) {
          overlaps = false
        }

        if (options.startDate && latestDate < options.startDate) {
          overlaps = false
        }

        return overlaps
      })

    // Apply limit if specified
    const result = options.limit ? filteredTournaments.slice(0, options.limit) : filteredTournaments

    return result
  }

  // If no date filters, query directly with optional limit
  let query = supabase
    .from('tournaments')
    .select(`
      *,
      tournament_dates:tournamentdates(
        id,
        tournament_id,
        event_date
      )
    `)
    .eq('created_by_club_id', clubId)
    .order('id', { ascending: false })

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching club tournaments:', error)
    throw new Error('Failed to fetch club tournaments')
  }

  return data || []
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
 * Gets all followers of a club using API endpoint
 */
export async function getClubFollowers(clubId: number): Promise<{
  club: { id: number; name: string },
  followers: Array<{ id: string; email: string; created_at: string }>,
  count: number
} | null> {
  try {
    // Get authentication token (optional for this endpoint since it's public data)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add auth header if available (though not required for this endpoint)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api/clubs/${clubId}/followers`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Club with ID ${clubId} not found`)
        return null
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching club followers:', error)
    throw error
  }
}
