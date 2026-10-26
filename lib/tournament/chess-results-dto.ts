// Client-safe response shapes of the chess-results admin API routes.

import type { SyncReport } from '@/lib/chess-results/sync'
import type { CrDetails } from '@/lib/chess-results/types'

export type { SyncReport }

export interface LinkedTournament {
  id: number
  title: string
}

export interface ChessResultsCounts {
  players: number
  teams: number
  /** Rounds with published pairings. */
  rounds: number
  games: number
}

/** GET /api/chess-results/preview. `details`/`counts` are null when the tnr is already linked. */
export interface ChessResultsPreview {
  tnr: number
  url: string
  linkedTournament: LinkedTournament | null
  details: CrDetails | null
  counts: ChessResultsCounts | null
  dates: string[]
}

/** POST import / sync / link responses. */
export interface ChessResultsSyncResponse {
  tournamentId: number
  report: SyncReport
}
