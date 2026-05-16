import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'
import { findPreviousPlayer, normalizePlayer, type RankingData } from '@/lib/rankingUtils'

interface HistoryPoint {
  filename: string
  month: number
  year: number
  date: string
  standard: number | null
  rapid: number | null
  blitz: number | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = (searchParams.get('playerId') || '').trim()
    const playerName = (searchParams.get('name') || '').trim()

    if (!playerId && !playerName) {
      return validationError('playerId o name es requerido')
    }

    const adminSupabase = createAdminClient()

    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (listError || !files) {
      return handleError(new Error('Failed to list ranking files: ' + (listError?.message || 'Unknown error')))
    }

    const rankingFiles = files
      .filter(f =>
        f.name.endsWith('.json') &&
        !f.name.startsWith('temp/') &&
        !f.name.includes('-analytics') &&
        f.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(f => {
        const match = f.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        return {
          filename: f.name,
          month,
          year,
          date: new Date(year, month - 1),
          created_at: f.created_at as string,
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => {
        const dt = a.date.getTime() - b.date.getTime()
        if (dt !== 0) return dt
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

    if (rankingFiles.length === 0) {
      return apiSuccess({ playerId, history: [] as HistoryPoint[] })
    }

    const target = { id: playerId || undefined, name: playerName }

    const downloads = await Promise.all(
      rankingFiles.map(async f => {
        const { data, error } = await adminSupabase.storage.from('ranking-data').download(f.filename)
        if (error || !data) return null
        try {
          const parsed = JSON.parse(await data.text()) as RankingData
          return { file: f, data: parsed }
        } catch {
          return null
        }
      })
    )

    const history: HistoryPoint[] = []
    for (const entry of downloads) {
      if (!entry) continue
      const players = (entry.data.players || []).map(normalizePlayer)
      const match = findPreviousPlayer(target, players)
      if (!match) continue
      history.push({
        filename: entry.file.filename.replace('.json', ''),
        month: entry.file.month,
        year: entry.file.year,
        date: entry.file.date.toISOString(),
        standard: match.ratings?.standard ?? null,
        rapid: match.ratings?.rapid ?? null,
        blitz: match.ratings?.blitz ?? null,
      })
    }

    return apiSuccess({ playerId, history })
  } catch (error) {
    return handleError(error)
  }
}
