import { NextRequest } from 'next/server'
import { z } from 'zod'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { chessResultsErrorResponse, syncTournamentWithChessResults } from '@/lib/tournament/chess-results'
import type { ChessResultsSyncResponse } from '@/lib/tournament/chess-results-dto'
import { apiSuccess, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({ tournamentId: z.number().int().positive() })

interface RouteParams {
  params: Promise<{ tnr: string }>
}

/**
 * POST /api/admin/chess-results/candidates/:tnr/link  { tournamentId }
 * Links a discovered chess-results tournament to an existing site tournament,
 * imports what is missing and marks the candidate as imported.
 * 200 { tournamentId, report } · 409 { error, tournamentId } when the tnr is linked elsewhere.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)
    const tnr = Number((await params).tnr)
    const body = bodySchema.safeParse(await request.json().catch(() => null))
    if (!Number.isInteger(tnr) || tnr <= 0 || !body.success) return validationError('Elegí el torneo a vincular.')

    const { tournamentId } = body.data
    const report = await syncTournamentWithChessResults(createAdminClient(), tournamentId, tnr)
    if (report.changed) revalidateTorneosCache()
    const response: ChessResultsSyncResponse = { tournamentId, report }
    return apiSuccess(response)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
