import { formatArgentinaCalendarDate } from '@/lib/dateUtils'
import type { TournamentStatus, TournamentStatusFilter } from '@/lib/utils/constants'
import type { Tournament, TournamentDisplay, TournamentWithDates } from './types'

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
 * Formats a date to a user-friendly string
 */
export function formatDate(date: Date): string {
  return formatArgentinaCalendarDate(date, {
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

  const startStr = formatArgentinaCalendarDate(startDate, {
    day: 'numeric',
    month: 'short'
  });

  const endStr = formatArgentinaCalendarDate(endDate, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Gets tournament status as a string
 */
export function getTournamentStatus(tournament: TournamentDisplay): TournamentStatus {
  if (tournament.is_upcoming) return 'upcoming';
  if (tournament.is_ongoing) return 'ongoing';
  return 'past';
}

/**
 * Computes tournament lifecycle status from its dates at a given instant.
 * Use this (over the precomputed is_* flags) when the result must stay fresh
 * regardless of when the page was rendered — e.g. client-side under ISR.
 */
export function getTournamentStatusAt(
  tournament: TournamentDisplay,
  now: number = Date.now()
): TournamentStatus {
  if (tournament.start_date.getTime() > now) return 'upcoming';
  const end = (tournament.end_date ?? tournament.start_date).getTime();
  if (end < now) return 'past';
  return 'ongoing';
}

/**
 * Display text for each tournament status
 */
export const TOURNAMENT_STATUS_TEXT: Record<TournamentStatus, string> = {
  upcoming: 'Próximo',
  ongoing: 'En curso',
  past: 'Finalizado',
};

/**
 * Gets tournament status display text
 */
export function getTournamentStatusText(tournament: TournamentDisplay): string {
  return TOURNAMENT_STATUS_TEXT[getTournamentStatus(tournament)];
}

/**
 * Filters tournaments by status
 */
export function filterTournamentsByStatus(
  tournaments: TournamentDisplay[],
  status: TournamentStatusFilter = 'all'
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
 * Gets the time display text
 */
export function getTimeDisplay(time: string | null): string {
  return time || 'Horario por confirmar';
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
