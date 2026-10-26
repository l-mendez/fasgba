// Parsed chess-results.com data. Pure data shapes shared by the parser,
// the admin import flow and the weekly sync job.

export type CrResult = '1-0' | '0-1' | '1/2-1/2' | '*'

export interface CrPlayer {
  startNo: number | null
  name: string
  title: string | null
  fideId: string | null
  rating: number | null
  federation: string | null
  club: string | null
}

export interface CrPlayerRef {
  name: string
  startNo: number | null
  rating: number | null
}

export interface CrGame {
  board: number
  white: CrPlayerRef
  black: CrPlayerRef
  result: CrResult
  forfeit: boolean
}

export interface CrTeamRef {
  startNo: number | null
  name: string
}

export interface CrTeamMatch {
  table: number
  home: CrTeamRef
  away: CrTeamRef
  games: CrGame[]
}

export interface CrRound {
  number: number
  date: string | null // YYYY-MM-DD
  games: CrGame[] // individual tournaments
  matches: CrTeamMatch[] // team tournaments
}

export interface CrTeam {
  startNo: number | null
  name: string
  players: CrPlayer[]
}

export interface CrDetails {
  tnr: number
  name: string
  organizer: string | null
  director: string | null
  chiefArbiter: string | null
  timeControl: string | null
  place: string | null
  rounds: number | null
  pairedRounds: number
  system: string | null
  startDate: string | null // YYYY-MM-DD
  endDate: string | null // YYYY-MM-DD
  isTeam: boolean
  lastUpdate: string | null
}

export interface CrTournament {
  details: CrDetails
  players: CrPlayer[] // individual tournaments
  teams: CrTeam[] // team tournaments (with rosters)
  rounds: CrRound[]
}

export interface CrSearchResult {
  tnr: number
  name: string
  startDate: string | null
  endDate: string | null
  organizer: string | null
  place: string | null
  timeControl: string | null
  rounds: number | null
  players: number | null
}
