// Tournament types based on new database schema (without direct date fields)
export interface Tournament {
  id: number;
  title: string;
  description: string | null;
  time: string | null;
  place: string | null;
  location: string | null;
  rounds: number | null;
  pace: string | null;
  inscription_details: string | null;
  cost: string | null;
  prizes: string | null;
  image: string | null;
  created_by_club_id?: number | null;
}

// Tournament dates from the separate table
export interface TournamentDate {
  id: number;
  tournament_id: number;
  event_date: string; // ISO date string
}

// Tournament with its associated dates
export interface TournamentWithDates extends Tournament {
  tournament_dates: TournamentDate[];
}

// Frontend-friendly tournament type with formatted dates
export interface TournamentDisplay extends Omit<Tournament, 'id'> {
  id: number;
  start_date: Date;
  end_date: Date | null;
  formatted_start_date: string;
  formatted_end_date: string | null;
  duration_days: number | null;
  is_upcoming: boolean;
  is_ongoing: boolean;
  is_past: boolean;
  all_dates: Date[]; // All tournament dates
  formatted_all_dates: string[]; // Formatted versions of all dates
}

// Summary type for tournament lists
export interface TournamentSummary {
  id: number;
  title: string;
  start_date: Date;
  end_date: Date | null;
  formatted_start_date: string;
  place: string | null;
  location: string | null;
  cost: string | null;
  image: string | null;
  is_upcoming: boolean;
  is_ongoing: boolean;
}

/**
 * Transforms tournament with dates to display format with proper date handling
 */
export function transformTournamentToDisplay(tournamentWithDates: TournamentWithDates): TournamentDisplay {
  const { tournament_dates, ...tournament } = tournamentWithDates;
  
  // Parse all dates as local dates to avoid timezone issues
  // The database stores dates as YYYY-MM-DD, so we need to parse them as local dates
  const allDates = tournament_dates
    .map(td => {
      // Parse as local date to avoid timezone offset issues
      const [year, month, day] = td.event_date.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    })
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (allDates.length === 0) {
    throw new Error(`Tournament "${tournament.title}" has no dates`);
  }
  
  const startDate = allDates[0];
  const endDate = allDates.length > 1 ? allDates[allDates.length - 1] : null;
  const now = new Date();

  // Calculate duration in days
  const durationDays = endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  // Determine tournament status
  const isUpcoming = startDate > now;
  const isPast = endDate ? endDate < now : startDate < now;
  const isOngoing = !isUpcoming && !isPast;

  // Format all dates
  const formattedAllDates = allDates.map(date => formatDate(date));

  return {
    ...tournament,
    start_date: startDate,
    end_date: endDate,
    formatted_start_date: formatDate(startDate),
    formatted_end_date: endDate ? formatDate(endDate) : null,
    duration_days: durationDays,
    is_upcoming: isUpcoming,
    is_ongoing: isOngoing,
    is_past: isPast,
    all_dates: allDates,
    formatted_all_dates: formattedAllDates,
  };
}

/**
 * Transforms tournament with dates to summary format for lists
 */
export function transformTournamentToSummary(tournamentWithDates: TournamentWithDates): TournamentSummary {
  const { tournament_dates, ...tournament } = tournamentWithDates;
  
  // Parse all dates as local dates to avoid timezone issues
  // The database stores dates as YYYY-MM-DD, so we need to parse them as local dates
  const allDates = tournament_dates
    .map(td => {
      // Parse as local date to avoid timezone offset issues
      const [year, month, day] = td.event_date.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    })
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (allDates.length === 0) {
    throw new Error(`Tournament "${tournament.title}" has no dates`);
  }
  
  const startDate = allDates[0];
  const endDate = allDates.length > 1 ? allDates[allDates.length - 1] : null;
  const now = new Date();

  const isUpcoming = startDate > now;
  const isPast = endDate ? endDate < now : startDate < now;
  const isOngoing = !isUpcoming && !isPast;

  return {
    id: tournament.id,
    title: tournament.title,
    start_date: startDate,
    end_date: endDate,
    formatted_start_date: formatDate(startDate),
    place: tournament.place,
    location: tournament.location,
    cost: tournament.cost,
    image: tournament.image,
    is_upcoming: isUpcoming,
    is_ongoing: isOngoing,
  };
}

/**
 * Formats a date to a user-friendly string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

/**
 * Formats a date range for tournaments
 */
export function formatDateRange(startDate: Date, endDate: Date | null): string {
  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDate);
  }

  const startStr = startDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short'
  });
  
  const endStr = endDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Gets tournament status as a string
 */
export function getTournamentStatus(tournament: TournamentDisplay): 'upcoming' | 'ongoing' | 'past' {
  if (tournament.is_upcoming) return 'upcoming';
  if (tournament.is_ongoing) return 'ongoing';
  return 'past';
}

/**
 * Gets tournament status display text
 */
export function getTournamentStatusText(tournament: TournamentDisplay): string {
  const status = getTournamentStatus(tournament);
  
  switch (status) {
    case 'upcoming':
      return 'Próximo';
    case 'ongoing':
      return 'En curso';
    case 'past':
      return 'Finalizado';
    default:
      return '';
  }
}

/**
 * Filters tournaments by status
 */
export function filterTournamentsByStatus(
  tournaments: TournamentDisplay[], 
  status: 'upcoming' | 'ongoing' | 'past' | 'all' = 'all'
): TournamentDisplay[] {
  if (status === 'all') return tournaments;
  
  return tournaments.filter(tournament => {
    switch (status) {
      case 'upcoming':
        return tournament.is_upcoming;
      case 'ongoing':
        return tournament.is_ongoing;
      case 'past':
        return tournament.is_past;
      default:
        return true;
    }
  });
}

/**
 * Sorts tournaments by start date
 */
export function sortTournamentsByDate(
  tournaments: TournamentDisplay[], 
  order: 'asc' | 'desc' = 'asc'
): TournamentDisplay[] {
  return [...tournaments].sort((a, b) => {
    const comparison = a.start_date.getTime() - b.start_date.getTime();
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Gets the cost display text, handling null values
 */
export function getCostDisplay(cost: string | null): string {
  if (!cost) return 'Gratuito';
  if (cost.toLowerCase().includes('free') || cost.toLowerCase().includes('gratuito')) {
    return 'Gratuito';
  }
  return cost;
}

/**
 * Gets the location display text, combining place and location
 */
export function getLocationDisplay(place: string | null, location: string | null): string {
  if (!place && !location) return 'Lugar por confirmar';
  if (place && location) return `${place}, ${location}`;
  return place || location || 'Lugar por confirmar';
}

/**
 * Gets the rounds display text
 */
export function getRoundsDisplay(rounds: number | null): string {
  if (!rounds) return 'Por definir';
  return `${rounds} ronda${rounds !== 1 ? 's' : ''}`;
}

/**
 * Gets the pace display text
 */
export function getPaceDisplay(pace: string | null): string {
  if (!pace) return 'Ritmo por definir';
  return pace;
}

/**
 * Validates if a tournament has minimum required information
 */
export function isValidTournament(tournament: Tournament): boolean {
  return !!(
    tournament.title
    // Note: dates are now validated separately via tournament_dates relationship
  );
}

/**
 * Gets a user-friendly error message for missing tournament data
 */
export function getTournamentDataStatus(tournament: Tournament): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!tournament.title) missingFields.push('título');
  
  if (!tournament.description) warnings.push('descripción');
  if (!tournament.place) warnings.push('lugar');
  if (!tournament.location) warnings.push('ubicación');
  if (!tournament.rounds) warnings.push('número de rondas');
  if (!tournament.pace) warnings.push('ritmo de juego');
  if (!tournament.cost) warnings.push('costo');

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

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
      const tournaments = paginated.map(t => ({
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
        .select('id, title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image, created_by_club_id')
        .order(orderBy, { ascending })
        .range(from, to);

      if (error) {
        console.error('Error fetching tournaments:', error);
        throw new Error('Failed to fetch tournaments');
      }

      const total = count || 0;
      const hasMore = from + pageSize < total;

      return {
        tournaments: data || [],
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
    const result = upcoming.map(t => ({
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
      created_by_club_id: null, // Add this field since it's not in TournamentDisplay
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
    return ongoing.map(t => ({
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
      created_by_club_id: null, // Add this field since it's not in TournamentDisplay
    }));
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Searches tournaments by title or description
 */
export async function searchTournaments(
  supabase: any,
  searchTerm: string,
  limit: number = 20
): Promise<Tournament[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, title, description, time, place, location, rounds, pace, inscription_details, cost, prizes, image, created_by_club_id')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error searching tournaments:', error);
      throw new Error('Failed to search tournaments');
    }

    return data || [];
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
 * Comprehensive function to get tournament summaries for lists
 */
export async function getTournamentSummaries(
  supabase: any,
  status: 'upcoming' | 'ongoing' | 'past' | 'all' = 'all',
  limit?: number
): Promise<TournamentSummary[]> {
  try {
    // For now, use the main function and filter client-side
    const tournaments = await getAllTournamentsForDisplay(supabase);
    const filtered = filterTournamentsByStatus(tournaments, status);
    const summaries = filtered.map(t => ({
      id: t.id,
      title: t.title,
      start_date: t.start_date,
      end_date: t.end_date,
      formatted_start_date: t.formatted_start_date,
      place: t.place,
      location: t.location,
      cost: t.cost,
      image: t.image,
      is_upcoming: t.is_upcoming,
      is_ongoing: t.is_ongoing,
    }));
    
    return limit ? summaries.slice(0, limit) : summaries;
  } catch (error) {
    console.error('Error getting tournament summaries:', error);
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
 * Creates a new tournament with its associated dates
 */
export async function createTournament(supabase: any, tournamentData: {
  title: string;
  description?: string;
  time?: string;
  place?: string;
  location?: string;
  rounds?: number;
  pace?: string;
  inscription_details?: string;
  cost?: string;
  prizes?: string;
  image?: string;
  dates: string[];
  created_by_club?: number;
}): Promise<Tournament> {
  try {
    // Extract dates from tournament data
    const { dates, ...tournamentFields } = tournamentData;

    // If created_by_club is provided, rename it to created_by_club_id for the database
    const dbTournamentFields = { ...tournamentFields };
    if (tournamentData.created_by_club) {
      (dbTournamentFields as any).created_by_club_id = tournamentData.created_by_club;
      delete (dbTournamentFields as any).created_by_club;
    }

    // Create the tournament record
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert([dbTournamentFields])
      .select()
      .single();

    if (tournamentError) {
      console.error('Error creating tournament:', tournamentError);
      throw new Error(`Failed to create tournament: ${tournamentError.message}`);
    }

    // Create tournament dates if provided
    if (dates && dates.length > 0) {
      const tournamentDatesData = dates.map(date => ({
        tournament_id: tournament.id,
        event_date: date
      }));

      const { error: datesError } = await supabase
        .from('tournamentdates')
        .insert(tournamentDatesData);

      if (datesError) {
        console.error('Error creating tournament dates:', datesError);
        // Optionally, you might want to delete the tournament if dates fail
        // For now, we'll just log the error and continue
      }
    }

    return tournament;
  } catch (error) {
    console.error('Error in createTournament:', error);
    throw error;
  }
}

/**
 * Updates an existing tournament and its dates
 */
export async function updateTournament(supabase: any, tournamentId: number, tournamentData: {
  title?: string;
  description?: string;
  time?: string;
  place?: string;
  location?: string;
  rounds?: number;
  pace?: string;
  inscription_details?: string;
  cost?: string;
  prizes?: string;
  image?: string;
  dates?: string[];
  created_by_club?: number;
}): Promise<boolean> {
  try {
    // Extract dates from tournament data
    const { dates, ...tournamentFields } = tournamentData;

    // If created_by_club is provided, rename it to created_by_club_id for the database
    const dbTournamentFields = { ...tournamentFields };
    if (tournamentData.created_by_club) {
      (dbTournamentFields as any).created_by_club_id = tournamentData.created_by_club;
      delete (dbTournamentFields as any).created_by_club;
    }

    // Update the tournament record
    const { error: tournamentError } = await supabase
      .from('tournaments')
      .update(dbTournamentFields)
      .eq('id', tournamentId);

    if (tournamentError) {
      console.error('Error updating tournament:', tournamentError);
      throw new Error(`Failed to update tournament: ${tournamentError.message}`);
    }

    // Update tournament dates if provided
    if (dates) {
      // First, delete existing dates
      const { error: deleteError } = await supabase
        .from('tournamentdates')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) {
        console.error('Error deleting existing tournament dates:', deleteError);
        throw new Error(`Failed to delete existing tournament dates: ${deleteError.message}`);
      }

      // Then, insert new dates if any
      if (dates.length > 0) {
        const tournamentDatesData = dates.map(date => ({
          tournament_id: tournamentId,
          event_date: date
        }));

        const { error: insertError } = await supabase
          .from('tournamentdates')
          .insert(tournamentDatesData);

        if (insertError) {
          console.error('Error inserting new tournament dates:', insertError);
          throw new Error(`Failed to insert new tournament dates: ${insertError.message}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateTournament:', error);
    throw error;
  }
}

/**
 * Deletes a tournament and its associated dates
 */
export async function deleteTournament(supabase: any, tournamentId: number): Promise<boolean> {
  try {
    // First delete tournament dates
    const { error: datesError } = await supabase
      .from('tournamentdates')
      .delete()
      .eq('tournament_id', tournamentId);

    if (datesError) {
      console.error('Error deleting tournament dates:', datesError);
      throw new Error(`Failed to delete tournament dates: ${datesError.message}`);
    }

    // Then delete the tournament
    const { error: tournamentError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (tournamentError) {
      console.error('Error deleting tournament:', tournamentError);
      throw new Error(`Failed to delete tournament: ${tournamentError.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTournament:', error);
    throw error;
  }
}
