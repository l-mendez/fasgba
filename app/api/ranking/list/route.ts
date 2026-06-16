import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { getCachedPublicRankingOptions, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

export async function GET() {
  try {
    return apiSuccess(await getCachedPublicRankingOptions(), 200, RANKING_CACHE_HEADERS)

  } catch (error) {
    console.error('Error listing rankings:', error)
    return handleError(error)
  }
}
