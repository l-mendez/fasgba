// Client-safe response shapes of the chess-results admin API routes.

import type { SyncReport } from '@/lib/chess-results/sync'
import type { ImportPlan } from '@/lib/chess-results/plan'
import type { CrDetails } from '@/lib/chess-results/types'

export type { ImportPlan, SyncReport }

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

/**
 * GET /api/chess-results/preview. `details`/`counts`/`plan` are null when the tnr
 * is already linked to a tournament other than the one being synced.
 */
export interface ChessResultsPreview {
  tnr: number
  url: string
  linkedTournament: LinkedTournament | null
  details: CrDetails | null
  counts: ChessResultsCounts | null
  dates: string[]
  /** Everything the import/sync would write, item by item. */
  plan: ImportPlan | null
}

/** POST import / sync / link responses. */
export interface ChessResultsSyncResponse {
  tournamentId: number
  report: SyncReport
}

/** GET /api/chess-results/options: what an admin can assign chess-results teams and players to. */
export interface ChessResultsOptions {
  teams: Array<{ id: number; name: string; clubName: string | null }>
  clubs: Array<{ id: number; name: string }>
  players: Array<{ id: number; name: string; fideId: string | null; clubName: string | null }>
}
