// Pure, client-safe ranking transforms (no server/supabase imports), shared by
// the server-side `getPlayers` and the client `PlayerList` island so both shape
// and paginate the player list identically.

import type { Player, RatingType, PaginatedPlayersResponse } from '@/lib/rankingUtils'

/**
 * Normalizes a player from the old format (no `ratings`) to the new format.
 */
export function normalizePlayer(player: any): Player {
  if (player.ratings) {
    return player as Player
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
 * Applies the search/active filters then paginates an (already sorted) player
 * list, returning the same shape as the server `getPlayers`.
 */
export function selectPlayersPage(
  players: Player[],
  { search = '', activeFilter = 'all', page = 1, pageSize = 50 }: SelectPlayersOptions = {}
): PaginatedPlayersResponse {
  const term = search.toLowerCase()
  const searched = term
    ? players.filter(
        p => p.name.toLowerCase().includes(term) || p.club.toLowerCase().includes(term)
      )
    : players

  const filtered =
    activeFilter === 'active'
      ? searched.filter(p => p.active)
      : activeFilter === 'inactive'
        ? searched.filter(p => !p.active)
        : searched

  const startIndex = (page - 1) * pageSize

  return {
    players: filtered.slice(startIndex, startIndex + pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  }
}
