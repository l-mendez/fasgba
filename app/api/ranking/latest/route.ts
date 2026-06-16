import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { getCachedLatestRankingData, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

export async function GET() {
  try {
    const rankingData = await getCachedLatestRankingData()

    // Validate data structure
    if (!rankingData.players || !Array.isArray(rankingData.players)) {
      return handleError(new Error('Invalid ranking data structure'))
    }

    return apiSuccess(rankingData, 200, RANKING_CACHE_HEADERS)

  } catch (error) {
    console.error('Error fetching latest ranking:', error)
    return handleError(error)
  }
}
