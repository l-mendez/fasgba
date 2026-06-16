// Shared storage helper for the ranking API routes. Lists the ranking JSON
// files once, parses month/year, and returns them most-recent-first so that
// "latest" resolves identically across the list/latest/analytics routes.

import { createAdminClient } from '@/lib/supabase/admin'

export interface RankingFile {
  name: string // full filename, including the .json extension
  month: number
  year: number
  date: Date
  created_at: string | null
}

const RANKING_FILE_RE = /^ranking-(\d{2})-(\d{4}).*\.json$/

export async function listSortedRankingFiles(
  adminSupabase: ReturnType<typeof createAdminClient>
): Promise<RankingFile[]> {
  const { data: files, error } = await adminSupabase.storage
    .from('ranking-data')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error || !files) {
    throw new Error('Failed to list ranking files: ' + (error?.message || 'Unknown error'))
  }

  return files
    .map((file): RankingFile | null => {
      const match = file.name.match(RANKING_FILE_RE)
      if (!match || file.name.startsWith('temp/') || file.name.includes('-analytics')) {
        return null
      }
      const month = parseInt(match[1])
      const year = parseInt(match[2])
      return {
        name: file.name,
        month,
        year,
        date: new Date(year, month - 1), // month - 1: Date months are 0-indexed
        created_at: file.created_at,
      }
    })
    .filter((f): f is RankingFile => f !== null)
    .sort((a, b) => {
      // Most recent first by the date in the filename, then by upload time so
      // that higher-numbered re-uploads of the same month come first.
      const dateComparison = b.date.getTime() - a.date.getTime()
      if (dateComparison !== 0) return dateComparison
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
}

// Public, shared ranking data is identical for everyone, so let the CDN serve
// it. 5 min matches the previous ISR window; stale-while-revalidate keeps it
// snappy while a fresh copy is fetched in the background.
export const RANKING_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}
