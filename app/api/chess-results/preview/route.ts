import { NextRequest } from 'next/server'
import { chessResultsEventDates } from '@/lib/chess-results/sync'
import { chessResultsUrl, parseChessResultsTnr } from '@/lib/chess-results/url'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  chessResultsCounts,
  chessResultsErrorResponse,
  findTournamentByTnr,
  loadChessResultsTournament,
  requireTournamentManager,
} from '@/lib/tournament/chess-results'
import type { ChessResultsPreview } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/chess-results/preview?url=<link or tnr>
 * Read-only: what an import would bring, or the site tournament already linked.
 */
export async function GET(request: NextRequest) {
  try {
    await requireTournamentManager(request)
    const tnr = parseChessResultsTnr(request.nextUrl.searchParams.get('url'))
    if (!tnr) return validationError('Link de chess-results inválido. Pegá el link del torneo o su número.')

    const linkedTournament = await findTournamentByTnr(createAdminClient(), tnr)
    const preview: ChessResultsPreview = { tnr, url: chessResultsUrl(tnr), linkedTournament, details: null, counts: null, dates: [] }
    if (!linkedTournament) {
      const cr = await loadChessResultsTournament(tnr, true)
      preview.details = cr.details
      preview.counts = chessResultsCounts(cr)
      preview.dates = chessResultsEventDates(cr)
    }
    return apiSuccess(preview)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
