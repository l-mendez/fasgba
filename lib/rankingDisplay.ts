// Pure, client-safe ranking transforms (no server/supabase imports) used by the
// client `PlayerList` island to shape, filter and paginate the player list.

import type { Player, PlayerRatings, RatingType, PaginatedPlayersResponse } from '@/lib/rankingUtils'
import { normalizeForSearch } from '@/lib/countries'

/** A player as stored in ranking JSON: legacy files have no `ratings`. */
type StoredPlayer = Omit<Player, 'ratings'> & { ratings?: PlayerRatings | null }

const hasRatings = (player: StoredPlayer): player is Player => Boolean(player.ratings)

/**
 * Normalizes a player from the old format (no `ratings`) to the new format.
 * Takes a raw entry of a stored ranking JSON `players` array.
 */
export function normalizePlayer(raw: unknown): Player {
  const player = raw as StoredPlayer
  if (hasRatings(player)) {
    return player
  }
  return {
    ...player,
    ratings: {
      standard: player.points || 0,
      rapid: null,
      blitz: null,
    },
    positions: {
      standard: player.position,
      rapid: 0,
      blitz: 0,
    },
  }
}

/**
 * Sorts players by a specific rating type and assigns position accordingly.
 * Players without that rating are pushed to the end.
 */
export function sortPlayersByRatingType(players: Player[], sortBy: RatingType): Player[] {
  const withRating = players.filter(p => p.ratings[sortBy] !== null && p.ratings[sortBy] !== 0)
  const withoutRating = players.filter(p => p.ratings[sortBy] === null || p.ratings[sortBy] === 0)

  withRating.sort((a, b) => (b.ratings[sortBy] || 0) - (a.ratings[sortBy] || 0))

  const sorted = withRating.map((player, index) => ({
    ...player,
    position: index + 1,
  }))

  const rest = withoutRating.map((player, index) => ({
    ...player,
    position: sorted.length + index + 1,
  }))

  return [...sorted, ...rest]
}

export interface SelectPlayersOptions {
  search?: string
  activeFilter?: 'active' | 'inactive' | 'all'
  page?: number
  pageSize?: number
}

/**
 * Applies the active filter (renumbering positions within it), then the search,
 * then paginates an (already sorted) player list.
 */
export function selectPlayersPage(
  players: Player[],
  { search = '', activeFilter = 'all', page = 1, pageSize = 50 }: SelectPlayersOptions = {}
): PaginatedPlayersResponse {
  // Filter by activity first and renumber within that view, so "Activos" reads
  // 1, 2, 3… instead of skipping inactive players' positions.
  const byActivity =
    activeFilter === 'all'
      ? players
      : players
          .filter(p => (activeFilter === 'active' ? p.active : !p.active))
          .map((p, index) => ({ ...p, position: index + 1 }))

  // Accent-insensitive, so "nunez" matches "Núñez"
  const term = normalizeForSearch(search.trim())
  const filtered = term
    ? byActivity.filter(
        p => normalizeForSearch(p.name).includes(term) || normalizeForSearch(p.club || '').includes(term)
      )
    : byActivity

  const startIndex = (page - 1) * pageSize

  return {
    players: filtered.slice(startIndex, startIndex + pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  }
}
