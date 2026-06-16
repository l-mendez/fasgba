import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { listSortedRankingFiles, RANKING_CACHE_HEADERS } from '@/lib/rankingStorage'

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export async function GET() {
  try {
    const adminSupabase = createAdminClient()
    const rankingFiles = await listSortedRankingFiles(adminSupabase)

    // Handle duplicate months by adding (2), (3), etc. (most recent keeps the
    // plain name since the list is already sorted most-recent-first).
    const monthYearCounts = new Map<string, number>()
    const processedRankings = rankingFiles.map(file => {
      const monthYearKey = `${file.month}-${file.year}`
      const currentCount = monthYearCounts.get(monthYearKey) || 0
      monthYearCounts.set(monthYearKey, currentCount + 1)

      const baseDisplayName = `${MONTH_NAMES[file.month - 1]} ${file.year}`
      const displayName = currentCount === 0
        ? baseDisplayName
        : `${baseDisplayName} (${currentCount + 1})`

      return {
        filename: file.name.replace('.json', ''),
        displayName,
        month: file.month,
        year: file.year,
        date: file.date,
      }
    })

    return apiSuccess(processedRankings, 200, RANKING_CACHE_HEADERS)

  } catch (error) {
    console.error('Error listing rankings:', error)
    return handleError(error)
  }
}
