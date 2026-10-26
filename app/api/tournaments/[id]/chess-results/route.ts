import { NextRequest } from 'next/server'
import { z } from 'zod'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { parseChessResultsTnr } from '@/lib/chess-results/url'
import { authenticateAndAuthorize } from '@/lib/middleware/tournamentAuth'
import { validateTournamentId } from '@/lib/schemas/tournamentSchemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { chessResultsErrorResponse, syncTournamentWithChessResults } from '@/lib/tournament/chess-results'
import type { ChessResultsSyncResponse } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, forbiddenError, notFoundError, unauthorizedError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({ url: z.union([z.string(), z.number()]).nullable().optional() })

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/tournaments/:id/chess-results  { url? }
 * Links the tournament to the given chess-results link (optional when already
 * linked) and imports missing players, rounds, games and results.
 * 200 { tournamentId, report } · 409 { error, tournamentId } when the link belongs to another tournament.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const tournamentId = validateTournamentId((await params).id)
    try {
      await authenticateAndAuthorize(request, tournamentId)
    } catch (authError) {
      const reason = authError instanceof Error ? authError.message : ''
      if (reason === 'UNAUTHORIZED') return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
      if (reason === 'FORBIDDEN') return forbiddenError('No tenés permisos para sincronizar este torneo.')
      if (reason === 'TOURNAMENT_NOT_FOUND') return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
      throw authError
    }

    const body = bodySchema.safeParse(await request.json().catch(() => ({})))
    const url = body.success ? body.data.url : null
    const tnr = url == null || url === '' ? null : parseChessResultsTnr(url)
    if (!body.success || (url != null && url !== '' && !tnr)) {
      return validationError('Link de chess-results inválido. Pegá el link del torneo o su número.')
    }

    const report = await syncTournamentWithChessResults(createAdminClient(), tournamentId, tnr)
    if (report.changed) revalidateTorneosCache()
    const response: ChessResultsSyncResponse = { tournamentId, report }
    return apiSuccess(response)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
