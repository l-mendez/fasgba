import type { DbClient } from '@/lib/db-types'
import type { Tournament, TournamentDisplay, TournamentWithDates } from './types'
import { sortTournamentsByDate, transformTournamentToDisplay } from './display'

// Database query functions
// Note: These assume you're using a database client like Supabase
// Adjust the implementation based on your actual database setup

/**
 * Fetches all tournaments with their dates from the database
 */
export async function getAllTournamentsWithDates(supabase: DbClient): Promise<TournamentWithDates[]> {
  try {
    // Query tournaments with their associated dates
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_dates:tournamentdates(
          id,
          tournament_id,
          event_date
        )
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase error fetching tournaments with dates:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }

    return data || [];
  } catch (error) {
    console.error('Database error in getAllTournamentsWithDates:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch tournaments with dates: Unknown error occurred');
  }
}

/**
 * Fetches all tournaments from the database (legacy function for compatibility)
 */
export async function getAllTournaments(supabase: DbClient): Promise<Omit<Tournament, 'registration_link'>[]> {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image, created_by_club_id')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw new Error('Failed to fetch tournaments');
    }

    return tournaments || [];
  } catch (error) {
    console.error('Error in getAllTournaments:', error);
    throw error;
  }
}

/**
 * Fetches a single tournament by ID
 */
export async function getTournamentById(supabase: DbClient, id: number): Promise<Tournament | null> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tournament not found
        return null;
      }
      console.error('Error fetching tournament:', error);
      throw new Error('Failed to fetch tournament');
    }

    return data;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Fetches tournaments with pagination
 */
export async function getTournamentsWithPagination(
  supabase: DbClient,
  page: number = 1,
  pageSize: number = 10,
  orderBy: 'start_date' | 'title' = 'start_date',
  ascending: boolean = true
): Promise<{ tournaments: Tournament[]; total: number; hasMore: boolean }> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error('Failed to get tournament count');
    }

    // For ordering by start_date, we need to use the tournamentdates table
    if (orderBy === 'start_date') {
      // Get all tournaments with dates and sort client-side for now
      const tournamentsWithDates = await getAllTournamentsWithDates(supabase);
      const tournamentsDisplay = tournamentsWithDates.map(transformTournamentToDisplay);
      const sorted = sortTournamentsByDate(tournamentsDisplay, ascending ? 'asc' : 'desc');
      const paginated = sorted.slice(from, from + pageSize);

      // Convert back to Tournament interface
      const tournaments: Tournament[] = paginated.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        time: t.time,
        place: t.place,
        location: t.location,
        rounds: t.rounds,
        pace: t.pace,
        inscription_details: t.inscription_details,
        cost: t.cost,
        prizes: t.prizes,
        image: t.image,
        registration_link: null,
      }));

      const total = count || 0;
      const hasMore = from + pageSize < total;

      return {
        tournaments,
        total,
        hasMore,
      };
    } else {
      // For other fields, we can order directly
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image, registration_link, created_by_club_id')
        .order(orderBy, { ascending })
        .range(from, to);

      if (error) {
        console.error('Error fetching tournaments:', error);
        throw new Error('Failed to fetch tournaments');
      }

      const total = count || 0;
      const hasMore = from + pageSize < total;

      return {
        tournaments: (data || []) as Tournament[],
        total,
        hasMore,
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Fetches upcoming tournaments
 */
export async function getUpcomingTournaments(supabase: DbClient, limit?: number): Promise<Tournament[]> {
  try {
    // Since tournaments no longer have direct date fields, we need to use the tournamentdates table
    // This is a more complex query, so for now we'll use the comprehensive function and filter
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase);
    const tournamentsDisplay = tournamentsWithDates.map(transformTournamentToDisplay);
    const upcoming = tournamentsDisplay.filter(t => t.is_upcoming);

    // Convert back to Tournament interface (without display-specific fields)
    const result: Tournament[] = upcoming.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      time: t.time,
      place: t.place,
      location: t.location,
      rounds: t.rounds,
      pace: t.pace,
      inscription_details: t.inscription_details,
      cost: t.cost,
      prizes: t.prizes,
      image: t.image,
      registration_link: null,
      created_by_club_id: null,
    }));

    return limit ? result.slice(0, limit) : result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Fetches ongoing tournaments
 */
export async function getOngoingTournaments(supabase: DbClient): Promise<Tournament[]> {
  try {
    // Since tournaments no longer have direct date fields, we need to use the tournamentdates table
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase);
    const tournamentsDisplay = tournamentsWithDates.map(transformTournamentToDisplay);
    const ongoing = tournamentsDisplay.filter(t => t.is_ongoing);

    // Convert back to Tournament interface (without display-specific fields)
    const result: Tournament[] = ongoing.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      time: t.time,
      place: t.place,
      location: t.location,
      rounds: t.rounds,
      pace: t.pace,
      inscription_details: t.inscription_details,
      cost: t.cost,
      prizes: t.prizes,
      image: t.image,
      registration_link: null,
      created_by_club_id: null,
    }));
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Comprehensive function to get all tournaments with display formatting
 */
export async function getAllTournamentsForDisplay(supabase: DbClient): Promise<TournamentDisplay[]> {
  try {
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase);
    return tournamentsWithDates.map(transformTournamentToDisplay);
  } catch (error) {
    console.error('Error getting tournaments for display:', error);
    throw error;
  }
}

/**
 * Counts participants for a tournament. For team tournaments, counts all
 * players from the clubs whose teams are registered. For individual tournaments,
 * counts rows in tournament_registrations.
 */
export async function getTournamentParticipantCount(
  supabase: DbClient,
  tournamentId: number,
  type: string | null | undefined
): Promise<number> {
  try {
    if (type === 'team') {
      const { data: registeredTeams } = await supabase
        .from('tournament_teams')
        .select('team_id, teams(club_id)')
        .eq('tournament_id', tournamentId)

      if (!registeredTeams || registeredTeams.length === 0) return 0

      const clubIds = [...new Set(
        registeredTeams.map((t) => t.teams?.club_id).filter(Boolean)
      )]
      if (clubIds.length === 0) return 0

      const { data: clubPlayers } = await supabase
        .from('players')
        .select('id')
        .in('club_id', clubIds)

      return clubPlayers?.length || 0
    }

    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('player_id')
      .eq('tournament_id', tournamentId)

    return registrations?.length || 0
  } catch (error) {
    console.error(`Error counting participants for tournament ${tournamentId}:`, error)
    return 0
  }
}
