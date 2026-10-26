import { NextRequest } from 'next/server'

import { runChessResultsSync } from '@/lib/chess-results/weekly'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
// 60 s is the Hobby ceiling without Fluid compute; the run stops 10 s early
// and leaves the remaining tournaments for the next week.
export const maxDuration = 60

/**
 * GET /api/cron/chess-results
 * Weekly Vercel cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return unauthorizedError('No autorizado')
  }
  try {
    const summary = await runChessResultsSync({ deadlineMs: maxDuration * 1000 - 10_000 })
    console.log('[cron/chess-results]', JSON.stringify(summary))
    return apiSuccess(summary)
  } catch (error) {
    return handleError(error)
  }
}
