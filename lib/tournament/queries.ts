import type { Tournament, TournamentDisplay, TournamentWithDates } from './types'
import { sortTournamentsByDate, transformTournamentToDisplay } from './display'

// Database query functions
// Note: These assume you're using a database client like Supabase
// Adjust the implementation based on your actual database setup

/**
 * Fetches all tournaments with their dates from the database
 */
export async function getAllTournamentsWithDates(supabase: any): Promise<TournamentWithDates[]> {
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
export async function getAllTournaments(supabase: any): Promise<Tournament[]> {
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
export async function getTournamentById(supabase: any, id: number): Promise<Tournament | null> {
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
  supabase: any,
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
export async function getUpcomingTournaments(supabase: any, limit?: number): Promise<Tournament[]> {
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
export async function getOngoingTournaments(supabase: any): Promise<Tournament[]> {
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
export async function getAllTournamentsForDisplay(supabase: any): Promise<TournamentDisplay[]> {
  try {
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase);
    return tournamentsWithDates.map(transformTournamentToDisplay);
  } catch (error) {
    console.error('Error getting tournaments for display:', error);
    throw error;
  }
}

/**
 * Debug function to check tournaments table status
 */
export async function checkTournamentsTable(supabase: any): Promise<{
  tableExists: boolean;
  rowCount: number;
  sampleData: any[];
  error?: string;
}> {
  try {
    // Check if table exists and get basic info
    const { data, error, count } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' })
      .limit(3);

    if (error) {
      return {
        tableExists: false,
        rowCount: 0,
        sampleData: [],
        error: error.message
      };
    }

    return {
      tableExists: true,
      rowCount: count || 0,
      sampleData: data || []
    };
  } catch (error) {
    return {
      tableExists: false,
      rowCount: 0,
      sampleData: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Debug function to check what columns actually exist in the tournaments table
 */
export async function checkTournamentsTableStructure(supabase: any): Promise<any> {
  try {
    // Query the information_schema to get table structure
    const { data, error } = await supabase.rpc('get_table_structure', {
      table_name: 'tournaments'
    });

    if (error) {
      console.error('Error checking table structure:', error);
      return { error: error.message };
    }

    // If the RPC doesn't exist, try alternative method
    if (!data) {
      // Alternative: query a single row to see the structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('tournaments')
        .select('*')
        .limit(1)
        .single();

      if (sampleError && sampleError.code !== 'PGRST116') {
        return { error: sampleError.message };
      }

      const columns = sampleData ? Object.keys(sampleData) : [];
      return { columns, sampleData };
    }

    return data;
  } catch (error) {
    console.error('Error in checkTournamentsTableStructure:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Counts participants for a tournament. For team tournaments, counts all
 * players from the clubs whose teams are registered. For individual tournaments,
 * counts rows in tournament_registrations.
 */
export async function getTournamentParticipantCount(
  supabase: any,
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
        registeredTeams.map((t: any) => t.teams?.club_id).filter(Boolean)
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
