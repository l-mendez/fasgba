// Shared storage helper for the ranking API routes. Lists the ranking JSON
// files once, parses month/year, and returns them most-recent-first so that
// "latest" resolves identically across the list/latest/analytics routes.

import { unstable_cache } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminRanking } from '@/lib/admin/initial-data'
import { findPreviousPlayer, normalizePlayer, type RankingData } from '@/lib/rankingUtils'

export interface RankingFile {
  name: string // full filename, including the .json extension
  month: number
  year: number
  date: Date
  created_at: string | null
  size: number
}

export interface PublicRankingOption {
  filename: string
  displayName: string
  month: number
  year: number
  date: Date
}

export interface RankingDataPayload {
  filename?: string
  players?: unknown[]
  totalPlayers?: number
  lastUpdated?: string
  [key: string]: unknown
}

export interface RankingHistoryPoint {
  filename: string
  month: number
  year: number
  date: string
  standard: number | null
  rapid: number | null
  blitz: number | null
}

const RANKING_FILE_RE = /^ranking-(\d{2})-(\d{4}).*\.json$/
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export const RANKING_CACHE_TAG = 'ranking'
export const ADMIN_RANKING_CACHE_TAG = 'admin-ranking'
export const ADMIN_RANKINGS_PAGE_SIZE = 20

export async function listSortedRankingFiles(
  adminSupabase: ReturnType<typeof createAdminClient>
): Promise<RankingFile[]> {
  const files: Array<{
    name: string
    created_at: string | null
    metadata?: { size?: number | null } | null
  }> = []

  const pageSize = 100
  let offset = 0

  while (true) {
    const { data, error } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: pageSize,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error || !data) {
      throw new Error('Failed to list ranking files: ' + (error?.message || 'Unknown error'))
    }

    files.push(...data)

    if (data.length < pageSize) {
      break
    }

    offset += pageSize
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
        size: file.metadata?.size || 0,
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

async function downloadJsonFile<T>(
  adminSupabase: ReturnType<typeof createAdminClient>,
  filename: string
): Promise<T> {
  const { data, error } = await adminSupabase.storage
    .from('ranking-data')
    .download(filename)

  if (error || !data) {
    throw new Error('Failed to download ranking file: ' + (error?.message || 'Unknown error'))
  }

  return JSON.parse(await data.text()) as T
}

function getDisplayNamesByFilename(files: RankingFile[]) {
  const monthYearGroups = new Map<string, RankingFile[]>()

  files.forEach((file) => {
    const key = `${file.month}-${file.year}`
    monthYearGroups.set(key, [...(monthYearGroups.get(key) || []), file])
  })

  const displayNames = new Map<string, string>()

  monthYearGroups.forEach((sameMonthFiles) => {
    const ordered = [...sameMonthFiles].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    )

    ordered.forEach((file, index) => {
      const baseDisplayName = `${MONTH_NAMES[file.month - 1]} ${file.year}`
      displayNames.set(
        file.name,
        index === 0 ? baseDisplayName : `${baseDisplayName} (${index + 1})`
      )
    })
  })

  return displayNames
}

export async function listAdminRankingSummaries(
  adminSupabase: ReturnType<typeof createAdminClient>
): Promise<AdminRanking[]> {
  const files = await listSortedRankingFiles(adminSupabase)
  const displayNames = getDisplayNamesByFilename(files)

  const rankings = await Promise.all(
    files.map(async (file): Promise<AdminRanking> => {
      let totalPlayers = 0
      let lastUpdated = file.created_at ?? new Date().toISOString()

      try {
        const data = await downloadJsonFile<RankingDataPayload>(adminSupabase, file.name)
        totalPlayers = data.totalPlayers || (Array.isArray(data.players) ? data.players.length : 0)
        lastUpdated = data.lastUpdated || lastUpdated
      } catch (error) {
        console.warn(`Could not parse ranking file ${file.name}:`, error)
      }

      return {
        id: file.name.replace('.json', ''),
        name: file.name.replace('.json', ''),
        displayName: displayNames.get(file.name),
        date: lastUpdated,
        totalPlayers,
        status: 'archived',
        filePath: file.name,
        size: file.size,
      }
    })
  )

  if (rankings.length > 0) {
    rankings[0].status = 'current'
  }

  return rankings
}

export const getCachedAdminRankingSummaries = unstable_cache(
  async () => {
    const adminSupabase = createAdminClient()
    return listAdminRankingSummaries(adminSupabase)
  },
  ['admin-ranking-summaries'],
  {
    tags: [ADMIN_RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

export function paginateRankings(rankings: AdminRanking[], page: number, pageSize = ADMIN_RANKINGS_PAGE_SIZE) {
  const total = rankings.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const offset = (safePage - 1) * pageSize

  return {
    rankings: rankings.slice(offset, offset + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasMore: offset + pageSize < total,
    nextPage: offset + pageSize < total ? safePage + 1 : null,
  }
}

export function buildPublicRankingOptions(files: RankingFile[]): PublicRankingOption[] {
  const monthYearCounts = new Map<string, number>()

  return files.map((file) => {
    const key = `${file.month}-${file.year}`
    const currentCount = monthYearCounts.get(key) || 0
    monthYearCounts.set(key, currentCount + 1)

    const baseDisplayName = `${MONTH_NAMES[file.month - 1]} ${file.year}`

    return {
      filename: file.name.replace('.json', ''),
      displayName: currentCount === 0 ? baseDisplayName : `${baseDisplayName} (${currentCount + 1})`,
      month: file.month,
      year: file.year,
      date: file.date,
    }
  })
}

export const getCachedPublicRankingOptions = unstable_cache(
  async () => {
    const adminSupabase = createAdminClient()
    return buildPublicRankingOptions(await listSortedRankingFiles(adminSupabase))
  },
  ['public-ranking-options'],
  {
    tags: [RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

export const getCachedLatestRankingData = unstable_cache(
  async () => {
    const adminSupabase = createAdminClient()
    const [latestFile] = await listSortedRankingFiles(adminSupabase)

    if (!latestFile) {
      throw new Error('No ranking files found')
    }

    return downloadJsonFile<RankingDataPayload>(adminSupabase, latestFile.name)
  },
  ['public-ranking-latest'],
  {
    tags: [RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

export const getCachedSpecificRankingData = unstable_cache(
  async (filename: string) => {
    const adminSupabase = createAdminClient()
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    return downloadJsonFile<RankingDataPayload>(adminSupabase, fullFilename)
  },
  ['public-ranking-specific'],
  {
    tags: [RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

export const getCachedRankingAnalytics = unstable_cache(
  async (ranking: string) => {
    const adminSupabase = createAdminClient()
    let baseName = ranking.replace('.json', '')

    if (!baseName) {
      const [latest] = await listSortedRankingFiles(adminSupabase)
      if (!latest) throw new Error('No ranking files found')
      baseName = latest.name.replace('.json', '')
    }

    const analyticsFilename = `${baseName}-analytics.json`
    const { data, error } = await adminSupabase.storage
      .from('ranking-data')
      .download(analyticsFilename)

    if (error || !data) return { details: [] }

    return JSON.parse(await data.text())
  },
  ['public-ranking-analytics'],
  {
    tags: [RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

export const getCachedRankingHistory = unstable_cache(
  async (_playerKey: string, playerId: string, playerName: string) => {
    const adminSupabase = createAdminClient()
    const rankingFiles = [...await listSortedRankingFiles(adminSupabase)].sort((a, b) => {
      const dateComparison = a.date.getTime() - b.date.getTime()
      if (dateComparison !== 0) return dateComparison
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    })

    if (rankingFiles.length === 0) {
      return [] as RankingHistoryPoint[]
    }

    const target = { id: playerId || undefined, name: playerName || '' }
    const downloads = await Promise.all(
      rankingFiles.map(async (file) => {
        try {
          const data = await downloadJsonFile<RankingData>(adminSupabase, file.name)
          return { file, data }
        } catch {
          return null
        }
      })
    )

    const history: RankingHistoryPoint[] = []

    for (const entry of downloads) {
      if (!entry) continue

      const players = (entry.data.players || []).map(normalizePlayer)
      const match = findPreviousPlayer(target, players)
      if (!match) continue

      history.push({
        filename: entry.file.name.replace('.json', ''),
        month: entry.file.month,
        year: entry.file.year,
        date: entry.file.date.toISOString(),
        standard: match.ratings?.standard ?? null,
        rapid: match.ratings?.rapid ?? null,
        blitz: match.ratings?.blitz ?? null,
      })
    }

    return history
  },
  ['public-ranking-history'],
  {
    tags: [RANKING_CACHE_TAG],
    revalidate: 60 * 60,
  }
)

// Public, shared ranking data is identical for everyone, so let the CDN serve
// it revalidate with the origin. The origin work is cached with tags above, so
// ranking mutations can invalidate deterministically.
export const RANKING_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
}
