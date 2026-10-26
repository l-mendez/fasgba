import { NextRequest } from 'next/server'
import { z } from 'zod'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { chessResultsEventDates, createTournamentFromChessResults } from '@/lib/chess-results/sync'
import { parseChessResultsTnr } from '@/lib/chess-results/url'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ChessResultsError,
  alreadyLinkedError,
  chessResultsErrorResponse,
  findTournamentByTnr,
  loadChessResultsTournament,
  markCandidateImported,
  requireTournamentManager,
} from '@/lib/tournament/chess-results'
import type { ChessResultsSyncResponse } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, forbiddenError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({
  url: z.union([z.string(), z.number()]),
  clubId: z.number().int().positive().nullable().optional(),
})

/**
 * POST /api/chess-results/import  { url, clubId? }
 * Creates a site tournament from chess-results. Site admins may pick any club
 * (or none); club admins import for a club they administer.
 * 201 { tournamentId, report } · 409 { error, tournamentId } when already linked.
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, clubIds } = await requireTournamentManager(request)
    const body = bodySchema.safeParse(await request.json().catch(() => null))
    const tnr = body.success ? parseChessResultsTnr(body.data.url) : null
    if (!body.success || !tnr) return validationError('Link de chess-results inválido. Pegá el link del torneo o su número.')

    let clubId = body.data.clubId ?? null
    if (!isAdmin) {
      if (clubId == null && clubIds.length === 1) clubId = clubIds[0]
      if (clubId == null) return validationError('Elegí el club que organiza el torneo.')
      if (!clubIds.includes(clubId)) return forbiddenError('No administrás ese club.')
    }

    const db = createAdminClient()
    const linked = await findTournamentByTnr(db, tnr)
    if (linked) throw alreadyLinkedError(linked)

    const cr = await loadChessResultsTournament(tnr)
    if (chessResultsEventDates(cr).length === 0) {
      throw new ChessResultsError('El torneo de chess-results no tiene fechas. Crealo a mano y vinculalo con el link.', 422)
    }
    const report = await createTournamentFromChessResults(db, cr, clubId).catch(async (error) => {
      // The tournament row is inserted before the rest; surface it so the admin can retry with a sync.
      const partial = await findTournamentByTnr(db, tnr).catch(() => null)
      if (!partial || /duplicate key/i.test(String(error?.message))) throw error
      revalidateTorneosCache()
      throw new ChessResultsError(`Se creó el torneo pero la importación quedó incompleta (${error?.message}). Abrilo y volvé a sincronizar.`, 500, partial.id)
    })
    await markCandidateImported(db, tnr, report.tournamentId)
    revalidateTorneosCache()

    const response: ChessResultsSyncResponse = { tournamentId: report.tournamentId, report }
    return apiSuccess(response, 201)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
