// Read-only preview of what syncing a chess-results tournament would write:
// every field, player, team, round and game, each marked new / fill / exists.
// Uses the same decisions as the sync (assign.ts), so the preview is what gets imported.

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatArgentinaDateOnly } from '@/lib/dateUtils'
import { fail, gameFill } from './db'
import { decideAll, loadSiteData, type Assignments, type PlayerDecision, type TeamDecision } from './assign'
import { nameKey } from './match'
import { chessResultsEventDates, tournamentFromChessResults } from './sync'
import type { CrGame, CrResult, CrTournament } from './types'

/** new: will be created · fill: pending result gets filled · exists: already on the site · skip: can't be imported */
export type PlanStatus = 'new' | 'fill' | 'exists' | 'skip'

export interface PlanField {
  label: string
  value: string | null // from chess-results
  current: string | null // on the site (existing tournaments)
  action: 'set' | 'fill' | 'keep'
}

export interface PlanPlayer {
  /** nameKey of the chess-results name: the key for the admin's assignment. */
  key: string
  name: string
  title: string | null
  fideId: string | null
  rating: number | null
  club: string | null // as chess-results shows it
  team: string | null
  decision: PlayerDecision
}

export interface PlanTeam {
  key: string
  name: string
  players: number
  decision: TeamDecision
}

export interface PlanGame {
  board: number
  white: string
  black: string
  result: CrResult
  forfeit: boolean
  hasPgn: boolean
  status: PlanStatus
}

export interface PlanMatch {
  home: string
  away: string
  status: PlanStatus
  games: PlanGame[]
}

export interface PlanRound {
  number: number
  date: string | null
  status: 'new' | 'exists'
  games: PlanGame[]
  matches: PlanMatch[]
}

export interface ImportPlan {
  fields: PlanField[]
  players: PlanPlayer[]
  teams: PlanTeam[]
  rounds: PlanRound[]
  summary: Record<'newPlayers' | 'existingPlayers' | 'newTeams' | 'newClubs' | 'unmatchedTeams' | 'newRounds' | 'newGames' | 'filledResults' | 'existingGames' | 'skippedGames' | 'pgns', number>
}

type ExistingGame = { result: string | null; pgn: string | null }

function gameStatus(game: CrGame, existing: ExistingGame | undefined): PlanStatus {
  if (!existing) return 'new'
  return gameFill(game, existing) ? 'fill' : 'exists'
}

const toPlanGame = (g: CrGame, status: PlanStatus): PlanGame => ({
  board: g.board, white: g.white.name, black: g.black.name, result: g.result, forfeit: g.forfeit, hasPgn: !!g.pgn, status,
})

async function siteTournament(db: SupabaseClient, tournamentId: number | null) {
  if (!tournamentId) return null
  const [t, dates, rounds] = await Promise.all([
    db.from('tournaments').select('title, tournament_type, pace, place, rounds, players_per_team').eq('id', tournamentId).single(),
    db.from('tournamentdates').select('event_date').eq('tournament_id', tournamentId).order('event_date'),
    db.from('rounds').select('id, round_number').eq('tournament_id', tournamentId),
  ])
  fail('leer el torneo', t.error ?? dates.error ?? rounds.error)
  const roundIds = (rounds.data ?? []).map((r) => r.id)
  const [games, matches] = await Promise.all([
    db.from('individual_games').select('round_id, white_player_id, black_player_id, result, pgn').in('round_id', roundIds),
    db.from('matches').select('id, round_id, team_a_id, team_b_id, match_games(board_number, result, pgn)').in('round_id', roundIds),
  ])
  fail('leer partidas', games.error ?? matches.error)
  return {
    row: t.data!,
    dates: (dates.data ?? []).map((d) => d.event_date),
    rounds: new Map((rounds.data ?? []).map((r) => [r.round_number, r.id])),
    games: games.data ?? [],
    matches: matches.data ?? [],
  }
}

function planFields(cr: CrTournament, site: Awaited<ReturnType<typeof siteTournament>>): PlanField[] {
  const f = tournamentFromChessResults(cr)
  const dates = chessResultsEventDates(cr)
  const rows: Array<[string, unknown, unknown, boolean]> = [
    ['Título', f.title, site?.row.title, true],
    ['Tipo', f.tournament_type === 'team' ? 'Por equipos' : 'Individual', site && (site.row.tournament_type === 'team' ? 'Por equipos' : 'Individual'), true],
    ['Ritmo de juego', f.pace, site?.row.pace, false],
    ['Lugar', f.place, site?.row.place, false],
    ['Rondas', f.rounds, site?.row.rounds, false],
    ['Jugadores por equipo', f.players_per_team, site?.row.players_per_team, false],
    ['Fechas', dates.map((d) => formatArgentinaDateOnly(d)).join(', '), site?.dates.map((d) => formatArgentinaDateOnly(d)).join(', '), false],
    ['Link de chess-results', `#${cr.details.tnr}`, null, false],
  ]
  return rows
    .filter(([, value]) => value != null && value !== '')
    .map(([label, value, current, fixed]) => {
      const cur = current == null || current === '' ? null : String(current)
      const action = !site ? 'set' : fixed || cur ? 'keep' : 'fill'
      return { label, value: String(value), current: cur, action: label === 'Link de chess-results' && site ? 'set' : action }
    })
}

export async function buildImportPlan(db: SupabaseClient, cr: CrTournament, tournamentId: number | null = null, assignments: Assignments = {}): Promise<ImportPlan> {
  const [site, siteData] = await Promise.all([siteTournament(db, tournamentId), loadSiteData(db, tournamentId)])
  const decisions = decideAll(siteData, cr, assignments)
  const playerId = (name: string) => { const d = decisions.players.get(nameKey(name)); return d?.kind === 'existing' ? d.playerId : null }
  const teamDecision = (name: string) => decisions.teams.get(nameKey(name))
  const teamId = (name: string) => { const d = teamDecision(name); return d && 'teamId' in d ? d.teamId : null }

  const rounds: PlanRound[] = cr.rounds.filter((r) => r.games.length || r.matches.length).map((round) => {
    const roundId = site?.rounds.get(round.number)
    const games = round.games.map((g) => {
      const w = playerId(g.white.name), b = playerId(g.black.name)
      const existing = roundId && w && b ? site!.games.find((x) => x.round_id === roundId && x.white_player_id === w && x.black_player_id === b) : undefined
      return toPlanGame(g, gameStatus(g, existing))
    })
    const matches = round.matches.map((m) => {
      const a = teamId(m.home.name), b = teamId(m.away.name)
      const unmatched = [m.home.name, m.away.name].some((n) => teamDecision(n)?.kind === 'unmatched')
      const existing = roundId && a && b
        ? site!.matches.find((x) => x.round_id === roundId && [x.team_a_id, x.team_b_id].sort().join() === [a, b].sort().join())
        : undefined
      const boards = (existing?.match_games ?? []) as Array<{ board_number: number; result: string | null; pgn: string | null }>
      return {
        home: m.home.name, away: m.away.name,
        status: unmatched ? 'skip' as const : existing ? 'exists' as const : 'new' as const,
        games: m.games.map((g) => toPlanGame(g, unmatched ? 'skip' : gameStatus(g, boards.find((x) => x.board_number === g.board)))),
      }
    })
    return { number: round.number, date: round.date, status: roundId ? 'exists' as const : 'new' as const, games, matches }
  })

  const listed = cr.details.isTeam ? cr.teams.flatMap((t) => t.players.map((p) => ({ ...p, team: t.name }))) : cr.players.map((p) => ({ ...p, team: null }))
  const players: PlanPlayer[] = [...new Map(listed.map((p) => [nameKey(p.name), p])).values()].flatMap((p) => {
    const decision = decisions.players.get(nameKey(p.name))
    return decision ? [{ key: nameKey(p.name), name: p.name, title: p.title, fideId: p.fideId, rating: p.rating, club: p.club, team: p.team, decision }] : []
  })
  const teams: PlanTeam[] = cr.teams.map((t) => ({
    key: nameKey(t.name), name: t.name, players: t.players.length, decision: teamDecision(t.name) ?? { kind: 'unmatched' as const },
  }))
  const newClubs = new Set([...decisions.teams.values(), ...decisions.players.values()]
    .flatMap((d) => (d.kind === 'new' && d.club && 'newName' in d.club ? [nameKey(d.club.newName)] : [])))
  const allGames = rounds.flatMap((r) => [...r.games, ...r.matches.flatMap((m) => m.games)])
  const count = (status: PlanStatus) => allGames.filter((g) => g.status === status).length
  return {
    fields: planFields(cr, site),
    players,
    teams,
    rounds,
    summary: {
      newPlayers: players.filter((p) => p.decision.kind === 'new').length,
      existingPlayers: players.filter((p) => p.decision.kind === 'existing').length,
      newTeams: teams.filter((t) => t.decision.kind === 'new').length,
      newClubs: newClubs.size,
      unmatchedTeams: teams.filter((t) => t.decision.kind === 'unmatched').length,
      newRounds: rounds.filter((r) => r.status === 'new').length,
      newGames: count('new'),
      filledResults: count('fill'),
      existingGames: count('exists'),
      skippedGames: count('skip'),
      pgns: allGames.filter((g) => g.hasPgn && (g.status === 'new' || g.status === 'fill')).length,
    },
  }
}
