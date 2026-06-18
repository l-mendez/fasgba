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
  registration_link: string | null;
  created_by_club_id?: number | null;
  // New fields
  tournament_type?: string | null;
  players_per_team?: number | null;
  max_teams?: number | null;
  registration_deadline?: string | null;
  team_match_points?: any | null;
}

// Tournament dates from the separate table
export interface TournamentDate {
  id: number;
  tournament_id: number;
  event_date: string; // ISO date string
}

// Tournament with its associated dates
export interface TournamentWithDates extends Tournament {
  tournament_dates: Array<{
    id: number;
    tournament_id: number;
    event_date: string;
  }>;
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
