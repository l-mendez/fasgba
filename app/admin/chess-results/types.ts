import type { ChessResultsCandidateRow } from "@/lib/db-types"
import type { LinkedTournament } from "@/lib/tournament/chess-results-dto"

export type CandidateStatus = "pending" | "ignored" | "imported"

export type CandidateItem = Pick<
  ChessResultsCandidateRow,
  "tnr" | "name" | "start_date" | "end_date" | "organizer" | "place" | "time_control" | "rounds" | "players"
> & {
  status: CandidateStatus
  suggested: LinkedTournament | null
  tournament: LinkedTournament | null
}

/** Site tournament a candidate can be linked to. */
export interface TournamentOption {
  id: number
  title: string
  startDate: string | null
  tnr: number | null
}
