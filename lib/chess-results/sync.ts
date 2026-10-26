// Writes chess-results data into our tournament tables. Idempotent: only
// inserts what is missing and fills pending ('*') results; never overwrites
// data an admin already entered. Pass a service-role client (or one whose
// RLS allows the writes) after checking permissions.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TournamentInsert, TournamentUpdate } from '@/lib/db-types'
import { nameKey, resolvePlayers } from './match'
import { syncTeams, type TeamSyncCounts } from './sync-teams'
import { applyGameUpdates, ensureRounds, fail, planGames } from './db'
import type { CrTournament } from './types'

export interface SyncReport extends TeamSyncCounts {
  tournamentId: number
  playersCreated: number
  registrationsCreated: number
  roundsCreated: number
  gamesCreated: number
  resultsUpdated: number
  /** True when anything was written besides the sync timestamp. */
  changed: boolean
}

/** Distinct event dates: round dates when published, otherwise start/end. */
export function chessResultsEventDates(cr: CrTournament): string[] {
  const roundDates = cr.rounds.map((r) => r.date).filter((d): d is string => !!d)
  const dates = roundDates.length ? roundDates : [cr.details.startDate, cr.details.endDate].filter((d): d is string => !!d)
  return [...new Set(dates)].sort()
}

/** Tournament row for a chess-results tournament that doesn't exist on the site yet. */
export function tournamentFromChessResults(cr: CrTournament): TournamentInsert {
  const d = cr.details
  const boards = Math.max(0, ...cr.rounds.flatMap((r) => r.matches.map((m) => m.games.length)))
  return {
    title: d.name,
    pace: d.timeControl,
    place: d.place,
    rounds: d.rounds,
    tournament_type: d.isTeam ? 'team' : 'individual',
    players_per_team: d.isTeam && boards > 0 ? boards : null,
    chess_results_tnr: d.tnr,
  }
}

async function syncIndividual(db: SupabaseClient, tournamentId: number, cr: CrTournament) {
  const refs = cr.rounds.flatMap((r) => r.games.flatMap((g) => [g.white, g.black]))
  const { ids, created: playersCreated } = await resolvePlayers(db, [...cr.players, ...refs])
  const idOf = (name: string) => ids.get(nameKey(name)) ?? null

  const { data: regs, error } = await db.from('tournament_registrations').select('player_id').eq('tournament_id', tournamentId)
  fail('leer inscripciones', error)
  const registered = new Set((regs ?? []).map((r) => r.player_id))
  const newRegs = [...new Set(cr.players.map((p) => idOf(p.name)))]
    .filter((id): id is number => id != null && !registered.has(id))
    .map((player_id) => ({ tournament_id: tournamentId, player_id }))
  if (newRegs.length) fail('crear inscripciones', (await db.from('tournament_registrations').insert(newRegs)).error)

  const played = cr.rounds.filter((r) => r.games.length)
  const rounds = await ensureRounds(db, tournamentId, played.map((r) => r.number))
  let gamesCreated = 0
  let resultsUpdated = 0
  let pgnsAdded = 0
  for (const round of played) {
    const roundId = rounds.ids.get(round.number)!
    const { data: games, error: gamesError } = await db.from('individual_games')
      .select('id, white_player_id, black_player_id, result, pgn').eq('round_id', roundId)
    fail('leer partidas', gamesError)
    const existing = new Map((games ?? []).map((g) => [`${g.white_player_id}:${g.black_player_id}`, g]))
    const plan = planGames(round.games, existing,
      (g) => { const w = idOf(g.white.name), b = idOf(g.black.name); return w && b ? `${w}:${b}` : null },
      (g) => ({ round_id: roundId, white_player_id: idOf(g.white.name), black_player_id: idOf(g.black.name), result: g.result, board_number: g.board, game_date: round.date }))
    if (plan.inserts.length) fail('crear partidas', (await db.from('individual_games').insert(plan.inserts)).error)
    await applyGameUpdates(db, 'individual_games', plan.updates)
    gamesCreated += plan.inserts.length
    resultsUpdated += plan.resultsUpdated
    pgnsAdded += plan.pgnsAdded
  }
  return { playersCreated, registrationsCreated: newRegs.length, roundsCreated: rounds.created, gamesCreated, resultsUpdated, pgnsAdded }
}

/** Links a tournament to chess-results and imports whatever is missing. */
export async function syncTournamentFromChessResults(db: SupabaseClient, tournamentId: number, cr: CrTournament): Promise<SyncReport> {
  const { data: t, error } = await db.from('tournaments').select('id, tournament_type, pace, place, rounds, players_per_team').eq('id', tournamentId).single()
  fail('leer el torneo', error)
  if (!t) throw new Error(`No existe el torneo ${tournamentId}`)
  if ((t.tournament_type ?? 'individual') !== (cr.details.isTeam ? 'team' : 'individual')) {
    throw new Error('El tipo de torneo (individual / por equipos) no coincide con chess-results')
  }
  const fields = tournamentFromChessResults(cr)
  const patch: TournamentUpdate = { chess_results_tnr: cr.details.tnr, chess_results_synced_at: new Date().toISOString() }
  if (!t.pace && fields.pace) patch.pace = fields.pace
  if (!t.place && fields.place) patch.place = fields.place
  if (!t.rounds && fields.rounds) patch.rounds = fields.rounds
  if (!t.players_per_team && fields.players_per_team) patch.players_per_team = fields.players_per_team
  fail('actualizar el torneo', (await db.from('tournaments').update(patch).eq('id', tournamentId)).error)

  const { count } = await db.from('tournamentdates').select('id', { count: 'exact', head: true }).eq('tournament_id', tournamentId)
  const dates = count ? [] : chessResultsEventDates(cr)
  if (dates.length) {
    fail('crear fechas', (await db.from('tournamentdates').insert(dates.map((event_date) => ({ tournament_id: tournamentId, event_date })))).error)
  }

  const counts = cr.details.isTeam
    ? { registrationsCreated: 0, ...(await syncTeams(db, tournamentId, cr)) }
    : { teamsLinked: 0, teamsCreated: 0, matchesCreated: 0, unmatchedTeams: [], ...(await syncIndividual(db, tournamentId, cr)) }
  const changed = Object.keys(patch).length > 2 || dates.length > 0 ||
    Object.values(counts).some((v) => typeof v === 'number' && v > 0)
  return { tournamentId, ...counts, changed }
}

/** Creates a site tournament from chess-results and imports its data. */
/** Admin edits applied on import (the type and the chess-results link always come from chess-results). */
export type ChessResultsImportEdits = Partial<Omit<TournamentInsert, 'id' | 'tournament_type' | 'chess_results_tnr' | 'created_by_club_id'>> & {
  dates?: string[]
}

/** Creates a site tournament from chess-results (with optional admin edits) and imports its data. */
export async function createTournamentFromChessResults(
  db: SupabaseClient,
  cr: CrTournament,
  createdByClubId: number | null = null,
  edits: ChessResultsImportEdits = {},
) {
  const { dates: editedDates, ...fields } = edits
  const dates = editedDates?.length ? editedDates : chessResultsEventDates(cr)
  // Tournaments without dates break the public listing.
  if (dates.length === 0) throw new Error('El torneo de chess-results no tiene fechas')
  const { data, error } = await db.from('tournaments')
    .insert({ ...tournamentFromChessResults(cr), ...fields, created_by_club_id: createdByClubId }).select('id').single()
  fail('crear el torneo', error)
  const rows = [...new Set(dates)].sort().map((event_date) => ({ tournament_id: data!.id, event_date }))
  fail('crear fechas', (await db.from('tournamentdates').insert(rows)).error)
  return syncTournamentFromChessResults(db, data!.id, cr)
}
