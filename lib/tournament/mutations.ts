import type { Tournament } from './types'

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
  // New fields
  tournament_type?: string;
  players_per_team?: number;
  max_teams?: number;
  registration_deadline?: string;
  team_match_points?: any;
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
  // New fields
  tournament_type?: string;
  players_per_team?: number;
  max_teams?: number;
  registration_deadline?: string;
  team_match_points?: any;
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
