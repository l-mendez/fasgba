import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import type { AnalyticsData } from '@/lib/rankingUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ranking = searchParams.get('ranking')
    const playerId = searchParams.get('playerId')

    if (!ranking) {
      return handleError(new Error('Missing ranking parameter'))
    }

    const baseName = ranking.replace('.json', '')
    const analyticsFilename = `${baseName}-analytics.json`

    const adminSupabase = createAdminClient()
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(analyticsFilename)

    if (downloadError || !fileData) {
      // No analytics file - return empty data
      return apiSuccess({ details: [] })
    }

    const jsonContent = await fileData.text()
    const analyticsData: AnalyticsData = JSON.parse(jsonContent)

    // Filter by player ID if provided
    const details = playerId
      ? analyticsData.details.filter(d => d.playerId === playerId)
      : analyticsData.details

    return apiSuccess({ details })
  } catch (error) {
    return handleError(error)
  }
}
