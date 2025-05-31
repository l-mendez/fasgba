import { supabase } from "./supabaseClient"

export interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

export interface ClubWithStats {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  memberCount: number
  adminCount: number
  followersCount: number
  newsCount: number
}

export interface ClubAdmin {
  user_id: number
  club_id: number
  user_name: string
  user_surname: string
  user_email: string
}

export interface ClubMember {
  id: number
  name: string
  surname: string
  email: string
  profile_picture: string | null
  biography: string | null
  current_elo: number | null
}

export interface ClubNews {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[] | null
  created_by_user_id: number | null
  created_at: string
  updated_at: string
  author_name?: string
}

/**
 * Gets all clubs
 */
export async function getAllClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching clubs:', error)
    return []
  }

  return data || []
}

/**
 * Gets a specific club by ID
 */
export async function getClubById(clubId: number): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single()

  if (error) {
    console.error('Error fetching club:', error)
    return null
  }

  return data
}

/**
 * Gets a club by name
 */
export async function getClubByName(clubName: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('name', clubName)
    .single()

  if (error) {
    console.error('Error fetching club by name:', error)
    return null
  }

  return data
}

/**
 * Gets club with statistics (member count, admin count, etc.)
 */
export async function getClubWithStats(clubId: number): Promise<ClubWithStats | null> {
  const club = await getClubById(clubId)
  if (!club) return null

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
 * Gets all members of a club
 */
export async function getClubMembers(clubId: number): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      surname,
      email,
      profile_picture,
      biography
    `)
    .eq('club_id', clubId)
    .order('name')

  if (error) {
    console.error('Error fetching club members:', error)
    return []
  }

  // Get current ELO for each member
  const membersWithElo = await Promise.all(
    (data || []).map(async (member) => {
      const currentElo = await getCurrentElo(member.id)
      return {
        ...member,
        current_elo: currentElo
      }
    })
  )

  return membersWithElo
}

/**
 * Gets all admins of a club
 */
export async function getClubAdmins(clubId: number): Promise<ClubAdmin[]> {
  const { data, error } = await supabase
    .from('club_admins')
    .select(`
      user_id,
      club_id,
      users!inner (
        name,
        surname,
        email
      )
    `)
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club admins:', error)
    return []
  }

  return (data || []).map(item => ({
    user_id: item.user_id,
    club_id: item.club_id,
    user_name: (item.users as any)?.name || '',
    user_surname: (item.users as any)?.surname || '',
    user_email: (item.users as any)?.email || ''
  }))
}

/**
 * Gets news from a specific club
 */
export async function getClubNews(clubId: number, limit?: number): Promise<ClubNews[]> {
  let query = supabase
    .from('news')
    .select(`
      *,
      users (
        name,
        surname
      )
    `)
    .eq('club_id', clubId)
    .order('date', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching club news:', error)
    return []
  }

  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    image: item.image,
    extract: item.extract,
    text: item.text,
    tags: item.tags,
    created_by_user_id: item.created_by_user_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    author_name: item.users ? `${item.users.name} ${item.users.surname}` : undefined
  }))
}

/**
 * Gets the count of members in a club
 */
export async function getClubMemberCount(clubId: number): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club member count:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets the count of admins in a club
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
 * Gets the count of followers of a club
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
 * Gets the count of news from a club
 */
export async function getClubNewsCount(clubId: number): Promise<number> {
  const { count, error } = await supabase
    .from('news')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if (error) {
    console.error('Error fetching club news count:', error)
    return 0
  }

  return count || 0
}

/**
 * Checks if a user is an admin of a specific club
 */
export async function isUserClubAdmin(userId: number, clubId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_admins')
    .select('*')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single()

  if (error) {
    return false
  }

  return data !== null
}

/**
 * Checks if a user is following a specific club
 */
export async function isUserFollowingClub(userId: number, clubId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_follows_club')
    .select('*')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single()

  if (error) {
    return false
  }

  return data !== null
}

/**
 * Follow a club
 */
export async function followClub(userId: number, clubId: number): Promise<boolean> {
  const { error } = await supabase
    .from('user_follows_club')
    .insert([{ user_id: userId, club_id: clubId }])

  if (error) {
    console.error('Error following club:', error)
    return false
  }

  return true
}

/**
 * Unfollow a club
 */
export async function unfollowClub(userId: number, clubId: number): Promise<boolean> {
  const { error } = await supabase
    .from('user_follows_club')
    .delete()
    .eq('user_id', userId)
    .eq('club_id', clubId)

  if (error) {
    console.error('Error unfollowing club:', error)
    return false
  }

  return true
}

/**
 * Gets clubs that a user is following
 */
export async function getUserFollowedClubs(userId: number): Promise<Club[]> {
  const { data, error } = await supabase
    .from('user_follows_club')
    .select(`
      clubs!inner (
        id,
        name,
        address,
        telephone,
        mail,
        schedule
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching followed clubs:', error)
    return []
  }

  return (data || []).map(item => (item.clubs as any)).filter(club => club !== null)
}

/**
 * Gets clubs that a user administers
 */
export async function getUserAdminClubs(userId: number): Promise<Club[]> {
  const { data, error } = await supabase
    .from('club_admins')
    .select(`
      clubs!inner (
        id,
        name,
        address,
        telephone,
        mail,
        schedule
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching admin clubs:', error)
    return []
  }

  return (data || []).map(item => (item.clubs as any)).filter(club => club !== null)
}

/**
 * Creates a new club
 */
export async function createClub(clubData: Omit<Club, 'id'>): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .insert([clubData])
    .select()
    .single()

  if (error) {
    console.error('Error creating club:', error)
    return null
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
    return false
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
    return false
  }

  return true
}

/**
 * Gets current ELO for a user (helper function)
 */
async function getCurrentElo(userId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('elohistory')
    .select('elo')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data?.elo || null
}

/**
 * Searches clubs by name (useful for search functionality)
 */
export async function searchClubsByName(searchTerm: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name')

  if (error) {
    console.error('Error searching clubs:', error)
    return []
  }

  return data || []
}

/**
 * Gets clubs with contact information (filters out clubs without email or phone)
 */
export async function getClubsWithContact(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .or('mail.is.not.null,telephone.is.not.null')
    .order('name')

  if (error) {
    console.error('Error fetching clubs with contact:', error)
    return []
  }

  return data || []
}
