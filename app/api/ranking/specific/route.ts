import { NextRequest } from 'next/server'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { getCachedSpecificRankingData, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return handleError(new Error('Filename parameter is required'))
    }

    const rankingData = await getCachedSpecificRankingData(filename)
    
    // Validate data structure
    if (!rankingData.players || !Array.isArray(rankingData.players)) {
      return handleError(new Error('Invalid ranking data structure'))
    }
    return apiSuccess(rankingData, 200, RANKING_CACHE_HEADERS)

  } catch (error) {
    console.error('Error fetching specific ranking:', error)
    return handleError(error)
  }
}
