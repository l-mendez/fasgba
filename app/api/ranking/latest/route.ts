import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { listSortedRankingFiles, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

export async function GET() {
  try {
    const adminSupabase = createAdminClient()

    // Find the chronologically latest ranking file (by date in filename).
    const rankingFiles = await listSortedRankingFiles(adminSupabase)
    const latestFile = rankingFiles[0]
    if (!latestFile) {
      return handleError(new Error('No ranking files found'))
    }

    // Download the latest ranking file
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(latestFile.name)

    if (downloadError || !fileData) {
      console.error('Failed to download ranking file:', downloadError)
      return handleError(new Error('Failed to download ranking file: ' + (downloadError?.message || 'Unknown error')))
    }

    const rankingData = JSON.parse(await fileData.text())

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
