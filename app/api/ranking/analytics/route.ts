import { NextRequest } from 'next/server'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { getCachedRankingAnalytics, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'
import type { AnalyticsData } from '@/lib/rankingUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ranking = searchParams.get('ranking')
    const playerId = searchParams.get('playerId')

    const analyticsData = await getCachedRankingAnalytics(ranking?.replace('.json', '') ?? '') as AnalyticsData

    // Filter by player ID if provided
    const details = playerId
      ? analyticsData.details.filter(d => d.playerId === playerId)
      : analyticsData.details

    return apiSuccess({ details }, 200, RANKING_CACHE_HEADERS)
  } catch (error) {
    return handleError(error)
  }
}
