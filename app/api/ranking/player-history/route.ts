import { NextRequest } from 'next/server'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'
import { getCachedRankingHistory, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = (searchParams.get('playerId') || '').trim()
    const playerName = (searchParams.get('name') || '').trim()

    if (!playerId && !playerName) {
      return validationError('playerId o name es requerido')
    }

    const cacheKey = playerId ? `id:${playerId}` : `name:${playerName.toLowerCase()}`
    const history = await getCachedRankingHistory(cacheKey, playerId, playerName)

    return apiSuccess({ playerId, history }, 200, RANKING_CACHE_HEADERS)
  } catch (error) {
    return handleError(error)
  }
}
