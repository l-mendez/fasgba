import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { listSortedRankingFiles, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'
import type { AnalyticsData } from '@/lib/rankingUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ranking = searchParams.get('ranking')
    const playerId = searchParams.get('playerId')

    const adminSupabase = createAdminClient()

    // An empty ranking means "latest" — resolve it here so callers don't need
    // the list endpoint loaded first to view a player's detail.
    let baseName = ranking?.replace('.json', '') ?? ''
    if (!baseName) {
      const [latest] = await listSortedRankingFiles(adminSupabase)
      if (!latest) {
        return handleError(new Error('No ranking files found'))
      }
      baseName = latest.name.replace('.json', '')
    }

    const analyticsFilename = `${baseName}-analytics.json`

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(analyticsFilename)

    if (downloadError || !fileData) {
      // No analytics file - return empty data
      return apiSuccess({ details: [] }, 200, RANKING_CACHE_HEADERS)
    }

    const jsonContent = await fileData.text()
    const analyticsData: AnalyticsData = JSON.parse(jsonContent)

    // Filter by player ID if provided
    const details = playerId
      ? analyticsData.details.filter(d => d.playerId === playerId)
      : analyticsData.details

    return apiSuccess({ details }, 200, RANKING_CACHE_HEADERS)
  } catch (error) {
    return handleError(error)
  }
}
