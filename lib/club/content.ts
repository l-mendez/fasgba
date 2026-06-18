import { supabase } from './service-client'
import type { ClubNews, DateFilterOptions } from './types'

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
            // Get nombre and apellido from user_metadata and combine them
            const nombre = userData.user.user_metadata?.nombre || ''
            const apellido = userData.user.user_metadata?.apellido || ''
            author_name = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido || undefined)
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
