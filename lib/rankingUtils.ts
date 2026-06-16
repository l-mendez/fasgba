import { normalizePlayer } from "@/lib/rankingDisplay"

// Re-exported for existing consumers that import it from this module.
export { normalizePlayer }

export type RatingType = 'standard' | 'rapid' | 'blitz';

export interface PlayerRatings {
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
}

export interface PlayerPositions {
  standard: number;
  rapid: number;
  blitz: number;
}

export interface TournamentDetail {
  periodo: string;
  playerId: string;
  playerName: string;
  club: string;
  eloBefore: number;
  wins: number;
  games: number;
  expectedScore: number;
  scoreDiff: number;
  avgOpponentRating: number;
  performanceRating: number;
  kFactor: number;
  eloChange: number;
  type: RatingType;
  tournament: string;
}

export interface AnalyticsData {
  filename: string;
  rankingFilename: string;
  month: number;
  year: number;
  details: TournamentDetail[];
}

export interface Player {
  position: number;
  id?: string;
  name: string;
  title?: string;
  club: string;
  category?: string;
  points: number;
  matches: number;
  ratings: PlayerRatings;
  positions?: PlayerPositions;
  changes?: {
    position: number | null;
    points: number;
    ratings?: { standard: number; rapid: number; blitz: number };
    isNew: boolean;
  };
  active: boolean;
}

export interface RankingData {
  version?: number;
  filename: string;
  lastUpdated: string;
  totalPlayers: number;
  month: number;
  year: number;
  previousRanking: string | null;
  players: Player[];
  analyticsFilename?: string;
}

export interface PaginatedPlayersResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Normalized name for legacy comparisons when no ID is available.
 */
export function normalizePlayerNameForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Finds the matching previous-ranking player for a current player.
 * Matches strictly by ID first. Falls back to name only against legacy records
 * that don't have an ID — never cross-matches by name when both sides have IDs,
 * since IDs that don't match mean different players.
 */
export function findPreviousPlayer<T extends { id?: string; name: string }>(
  player: { id?: string; name: string },
  previousPlayers: T[]
): T | undefined {
  if (player.id) {
    const byId = previousPlayers.find(p => p.id && p.id === player.id);
    if (byId) return byId;
  }
  const target = normalizePlayerNameForMatch(player.name);
  return previousPlayers.find(p => !p.id && normalizePlayerNameForMatch(p.name) === target);
}

/**
 * Maps a numeric tipo value to a RatingType string
 */
export function mapTipoToRatingType(tipo: number): RatingType {
  switch (tipo) {
    case 1: return 'standard';
    case 2: return 'rapid';
    case 3: return 'blitz';
    default: return 'standard';
  }
}

/**
 * Returns the display label for a rating type (Spanish)
 */
export function getRatingTypeLabel(type: RatingType): string {
  switch (type) {
    case 'standard': return 'Standard';
    case 'rapid': return 'Rápido';
    case 'blitz': return 'Blitz';
  }
}

/**
 * Computes positions for each rating type by sorting players
 */
export function computePositionsByRatingType(players: Player[]): Player[] {
  const ratingTypes: RatingType[] = ['standard', 'rapid', 'blitz'];

  // Initialize positions maps
  const positionMaps: Record<RatingType, Map<string, number>> = {
    standard: new Map(),
    rapid: new Map(),
    blitz: new Map(),
  };

  for (const type of ratingTypes) {
    const sorted = [...players]
      .filter(p => p.ratings[type] !== null && p.ratings[type] !== 0)
      .sort((a, b) => (b.ratings[type] || 0) - (a.ratings[type] || 0));

    sorted.forEach((player, index) => {
      const key = player.id || player.name;
      positionMaps[type].set(key, index + 1);
    });
  }

  return players.map(player => {
    const key = player.id || player.name;
    return {
      ...player,
      positions: {
        standard: positionMaps.standard.get(key) || 0,
        rapid: positionMaps.rapid.get(key) || 0,
        blitz: positionMaps.blitz.get(key) || 0,
      },
    };
  });
}
