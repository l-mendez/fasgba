import { NextRequest } from 'next/server'
import { buildImportPlan } from '@/lib/chess-results/plan'
import { chessResultsEventDates } from '@/lib/chess-results/sync'
import { chessResultsUrl, parseChessResultsTnr } from '@/lib/chess-results/url'
import { authenticateAndAuthorize } from '@/lib/middleware/tournamentAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  chessResultsCounts,
  chessResultsErrorResponse,
  findTournamentByTnr,
  loadChessResultsTournament,
  parseAssignments,
  requireTournamentManager,
} from '@/lib/tournament/chess-results'
import type { ChessResultsPreview } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, forbiddenError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Read-only: everything an import (or, with tournamentId, a sync into that
 * tournament) would write, or the site tournament the tnr is already linked to.
 * GET ?url=<link or tnr>&tournamentId=<id>, or POST { url, tournamentId?, assignments? }
 * to see the result of the admin's team/player choices.
 */
async function preview(request: NextRequest, url: unknown, tournamentId: number | null, assignmentsInput: unknown) {
  if (tournamentId) {
    try {
      await authenticateAndAuthorize(request, tournamentId)
    } catch {
      return forbiddenError('No tenés permisos para sincronizar este torneo.')
    }
  } else {
    await requireTournamentManager(request)
  }
  const tnr = parseChessResultsTnr(typeof url === 'string' || typeof url === 'number' ? url : null)
  if (!tnr) return validationError('Link de chess-results inválido. Pegá el link del torneo o su número.')
  const assignments = parseAssignments(assignmentsInput)

  const db = createAdminClient()
  const linked = await findTournamentByTnr(db, tnr)
  const linkedTournament = linked && linked.id !== tournamentId ? linked : null
  const result: ChessResultsPreview = { tnr, url: chessResultsUrl(tnr), linkedTournament, details: null, counts: null, dates: [], plan: null }
  if (!linkedTournament) {
    // A fresh download for the first look; recalculations with assignments reuse it.
    const cr = await loadChessResultsTournament(tnr, assignmentsInput === undefined)
    result.details = cr.details
    result.counts = chessResultsCounts(cr)
    result.dates = chessResultsEventDates(cr)
    result.plan = await buildImportPlan(db, cr, tournamentId, assignments)
  }
  return apiSuccess(result)
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const tournamentId = params.get('tournamentId') ? Number(params.get('tournamentId')) : null
    return await preview(request, params.get('url'), tournamentId, undefined)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const tournamentId = Number(body?.tournamentId) || null
    return await preview(request, body?.url, tournamentId, body?.assignments ?? {})
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
