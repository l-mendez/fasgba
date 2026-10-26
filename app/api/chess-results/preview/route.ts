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
  requireTournamentManager,
} from '@/lib/tournament/chess-results'
import type { ChessResultsPreview } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, forbiddenError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/chess-results/preview?url=<link or tnr>[&tournamentId=<id>]
 * Read-only: everything an import (or, with tournamentId, a sync into that
 * tournament) would write, or the site tournament the tnr is already linked to.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const tournamentId = params.get('tournamentId') ? Number(params.get('tournamentId')) : null
    if (tournamentId) {
      try {
        await authenticateAndAuthorize(request, tournamentId)
      } catch {
        return forbiddenError('No tenés permisos para sincronizar este torneo.')
      }
    } else {
      await requireTournamentManager(request)
    }
    const tnr = parseChessResultsTnr(params.get('url'))
    if (!tnr) return validationError('Link de chess-results inválido. Pegá el link del torneo o su número.')

    const db = createAdminClient()
    const linked = await findTournamentByTnr(db, tnr)
    const linkedTournament = linked && linked.id !== tournamentId ? linked : null
    const preview: ChessResultsPreview = { tnr, url: chessResultsUrl(tnr), linkedTournament, details: null, counts: null, dates: [], plan: null }
    if (!linkedTournament) {
      const cr = await loadChessResultsTournament(tnr, true)
      preview.details = cr.details
      preview.counts = chessResultsCounts(cr)
      preview.dates = chessResultsEventDates(cr)
      preview.plan = await buildImportPlan(db, cr, tournamentId)
    }
    return apiSuccess(preview)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
