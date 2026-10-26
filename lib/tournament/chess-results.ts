// Server helpers shared by the admin chess-results API routes (preview,
// import, sync, link). Pass a service-role client after checking permissions.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchChessResultsTournament } from '@/lib/chess-results/fetch'
import { syncTournamentFromChessResults, type SyncReport } from '@/lib/chess-results/sync'
import type { Assignments } from '@/lib/chess-results/assign'
import type { CrTournament } from '@/lib/chess-results/types'
import { z } from 'zod'
import { ForbiddenError, UnauthorizedError, getAuthenticatedUser, getClubAdminClubIds } from '@/lib/middleware/auth'
import { handleError } from '@/lib/utils/apiResponse'
import type { ChessResultsCounts, LinkedTournament } from './chess-results-dto'

/** Site admins and club admins may preview/import; returns the clubs a club admin manages. */
export async function requireTournamentManager(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) throw new UnauthorizedError()
  const isAdmin = !!user.permissions?.isAdmin
  const clubIds = isAdmin ? [] : await getClubAdminClubIds(user.id)
  if (!isAdmin && clubIds.length === 0) throw new ForbiddenError('Solo los administradores pueden importar torneos.')
  return { user, isAdmin, clubIds }
}

/** Error with an HTTP status (and optionally the tournament already linked to the tnr). */
export class ChessResultsError extends Error {
  constructor(message: string, public status: number, public tournamentId?: number) {
    super(message)
    this.name = 'ChessResultsError'
  }
}

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<number, { at: number; cr: CrTournament }>()

/** Downloads a chess-results tournament, reusing a recent download (e.g. the preview) unless `fresh`. */
export async function loadChessResultsTournament(tnr: number, fresh = false): Promise<CrTournament> {
  const now = Date.now()
  const hit = cache.get(tnr)
  if (!fresh && hit && now - hit.at < CACHE_TTL_MS) return hit.cr
  let cr: CrTournament
  try {
    cr = await fetchChessResultsTournament(tnr)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const notFound = message.startsWith('No se encontró')
    throw new ChessResultsError(notFound ? message : `No se pudo leer chess-results: ${message}`, notFound ? 404 : 502)
  }
  for (const [key, entry] of cache) if (now - entry.at >= CACHE_TTL_MS) cache.delete(key)
  cache.set(tnr, { at: now, cr })
  return cr
}

export function chessResultsCounts(cr: CrTournament): ChessResultsCounts {
  const played = cr.rounds.filter((r) => r.games.length || r.matches.length)
  return {
    players: cr.details.isTeam ? cr.teams.reduce((n, t) => n + t.players.length, 0) : cr.players.length,
    teams: cr.teams.length,
    rounds: played.length,
    games: played.reduce((n, r) => n + r.games.length + r.matches.reduce((m, x) => m + x.games.length, 0), 0),
  }
}

export async function findTournamentByTnr(db: SupabaseClient, tnr: number): Promise<LinkedTournament | null> {
  const { data, error } = await db.from('tournaments').select('id, title').eq('chess_results_tnr', tnr).maybeSingle()
  if (error) throw new Error(`Error al buscar el torneo vinculado: ${error.message}`)
  return data
}

export function alreadyLinkedError(linked: LinkedTournament): ChessResultsError {
  return new ChessResultsError(`Ese torneo de chess-results ya está vinculado a «${linked.title}».`, 409, linked.id)
}

/** Throws 409 when the tnr already belongs to a tournament other than `tournamentId`. */
export async function assertTnrAvailable(db: SupabaseClient, tnr: number, tournamentId?: number) {
  const linked = await findTournamentByTnr(db, tnr)
  if (linked && linked.id !== tournamentId) throw alreadyLinkedError(linked)
}

/** 409 response when a tournament create/update would reuse a tnr linked elsewhere, else null. */
export async function tnrConflictResponse(db: SupabaseClient, tnr: number | null | undefined, tournamentId?: number) {
  if (!tnr) return null
  const linked = await findTournamentByTnr(db, tnr)
  return linked && linked.id !== tournamentId ? chessResultsErrorResponse(alreadyLinkedError(linked)) : null
}

/** Marks a discovered candidate as imported, if the weekly job found it. Best effort. */
export async function markCandidateImported(db: SupabaseClient, tnr: number, tournamentId: number) {
  const { error } = await db.from('chess_results_candidates')
    .update({ status: 'imported', tournament_id: tournamentId, updated_at: new Date().toISOString() })
    .eq('tnr', tnr)
  if (error) console.error('[chess-results] no se pudo marcar el candidato', tnr, error)
}

/** Links a tournament to `tnr` (when given) and imports whatever is missing from chess-results. */
export async function syncTournamentWithChessResults(db: SupabaseClient, tournamentId: number, tnr?: number | null, assignments: Assignments = {}): Promise<SyncReport> {
  const { data: tournament, error } = await db.from('tournaments')
    .select('id, tournament_type, chess_results_tnr').eq('id', tournamentId).maybeSingle()
  if (error) throw new Error(`Error al leer el torneo: ${error.message}`)
  if (!tournament) throw new ChessResultsError('Torneo no encontrado.', 404)
  const target = tnr ?? tournament.chess_results_tnr
  if (!target) throw new ChessResultsError('Este torneo no está vinculado a chess-results. Pegá el link para vincularlo.', 400)
  await assertTnrAvailable(db, target, tournamentId)

  // Reuse the download the preview just showed, so what was reviewed is what gets imported.
  const cr = await loadChessResultsTournament(target)
  const crType = cr.details.isTeam ? 'team' : 'individual'
  if ((tournament.tournament_type ?? 'individual') !== crType) {
    throw new ChessResultsError(
      `El torneo es ${crType === 'team' ? 'individual' : 'por equipos'} pero en chess-results es ${crType === 'team' ? 'por equipos' : 'individual'}. Cambiá el tipo antes de sincronizar.`,
      422,
    )
  }
  const report = await syncTournamentFromChessResults(db, tournamentId, cr, assignments)
  await markCandidateImported(db, target, tournamentId)
  return report
}

const isTnrUniqueViolation = (error: unknown) =>
  error instanceof Error && /duplicate key/i.test(error.message) && /chess_results_tnr/.test(error.message)

/** API response for errors thrown by these helpers (falls back to handleError). */
export function chessResultsErrorResponse(error: unknown): NextResponse {
  if (error instanceof ChessResultsError) {
    const code = error.status === 409 ? 'ALREADY_LINKED' : error.status === 404 ? 'NOT_FOUND' : 'CHESS_RESULTS_ERROR'
    return NextResponse.json({ error: error.message, code, tournamentId: error.tournamentId }, { status: error.status })
  }
  if (isTnrUniqueViolation(error)) {
    return NextResponse.json({ error: 'Ese torneo de chess-results ya está vinculado a otro torneo.', code: 'ALREADY_LINKED' }, { status: 409 })
  }
  return handleError(error)
}

const clubRefSchema = z.union([
  z.object({ id: z.number().int().positive(), name: z.string() }),
  z.object({ newName: z.string().trim().min(1, 'Poné el nombre del club nuevo').max(255) }),
])

/** Admin's team/player assignments from the import review (see lib/chess-results/assign.ts). */
export const assignmentsSchema = z.object({
  teams: z.record(z.string(), z.union([
    z.object({ teamId: z.number().int().positive() }),
    z.object({ newTeam: z.string().trim().min(1, 'Poné el nombre del equipo').max(255), club: clubRefSchema }),
  ])).optional(),
  players: z.record(z.string(), z.union([
    z.object({ playerId: z.number().int().positive() }),
    z.object({ newPlayer: z.literal(true), club: clubRefSchema.nullable() }),
  ])).optional(),
}).optional().default({})

/** Parses the optional `assignments` of a request body (400 when malformed). */
export function parseAssignments(value: unknown): Assignments {
  const parsed = assignmentsSchema.safeParse(value)
  if (!parsed.success) throw new ChessResultsError(`Revisá equipos y jugadores: ${parsed.error.issues.map((i) => i.message).join(', ')}`, 400)
  return parsed.data
}
