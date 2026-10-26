import { NextRequest } from 'next/server'

import { runChessResultsSync } from '@/lib/chess-results/weekly'
import { requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/admin/chess-results/run[?dryRun=1]
 * Runs the weekly chess-results job now ("Buscar ahora") and returns its summary.
 * With dryRun nothing is written; the summary shows what would change.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const dryRun = ['1', 'true'].includes(request.nextUrl.searchParams.get('dryRun') ?? '')
    return apiSuccess(await runChessResultsSync({ dryRun, deadlineMs: maxDuration * 1000 - 10_000 }))
  } catch (error) {
    return handleError(error)
  }
}
