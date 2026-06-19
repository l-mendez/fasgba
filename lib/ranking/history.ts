import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizePlayer, findPreviousPlayer } from '@/lib/rankingUtils'
import type { RankingPlayer } from './types'

// ---------------------------------------------------------------------------
// Previous-ranking lookup + change calc + recalculation check
// ---------------------------------------------------------------------------

// Helper function to find previous ranking
export async function findPreviousRanking(adminSupabase: SupabaseClient, currentMonth: number, currentYear: number) {
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      console.warn('Could not list files to find previous ranking:', listError)
      return null
    }

    const rankingFiles = files
      .filter((file: any) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        !file.name.includes('-analytics') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: any) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        return {
          filename: file.name,
          month: parseInt(match[1]),
          year: parseInt(match[2]),
          date: new Date(parseInt(match[2]), parseInt(match[1]) - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean)

    // Check for same month/year ranking first
    const sameMonthRankings = rankingFiles
      .filter((ranking: any) => ranking.month === currentMonth && ranking.year === currentYear)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    if (sameMonthRankings.length > 0) {
      const sameMonthPrevious = sameMonthRankings[sameMonthRankings.length - 1]!
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(sameMonthPrevious.filename)

      if (!downloadError && fileData) {
        const jsonContent = await fileData.text()
        const previousData = JSON.parse(jsonContent)
        return {
          filename: sameMonthPrevious.filename.replace('.json', ''),
          players: (previousData.players || []).map(normalizePlayer)
        }
      }
    }

    // Fall back to chronologically previous ranking
    const chronologicalRankings = rankingFiles
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())

    const currentDate = new Date(currentYear, currentMonth - 1)
    const previousRanking = chronologicalRankings.find((ranking: any) =>
      ranking.date.getTime() < currentDate.getTime()
    )

    if (!previousRanking) return null

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(previousRanking.filename)

    if (downloadError || !fileData) {
      console.warn('Could not download previous ranking:', downloadError)
      return null
    }

    const jsonContent = await fileData.text()
    const previousData = JSON.parse(jsonContent)
    return {
      filename: previousRanking.filename.replace('.json', ''),
      players: (previousData.players || []).map(normalizePlayer)
    }
  } catch (error) {
    console.warn('Error finding previous ranking:', error)
    return null
  }
}

// Calculate changes for each player, including per-rating changes
export function calculatePlayerChanges(newPlayers: RankingPlayer[], previousPlayers: any[]) {
  return newPlayers.map(player => {
    const previousPlayer = findPreviousPlayer(player, previousPlayers)

    if (!previousPlayer) {
      return {
        ...player,
        changes: {
          position: null,
          points: 0,
          ratings: { standard: 0, rapid: 0, blitz: 0 },
          isNew: true
        }
      }
    }

    const positionChange = previousPlayer.position - player.position
    const pointsChange = Math.round(player.points - (previousPlayer.points || 0))

    const prevRatings = previousPlayer.ratings || { standard: previousPlayer.points || 0, rapid: null, blitz: null }
    const ratingChanges = {
      standard: Math.round((player.ratings.standard || 0) - (prevRatings.standard || 0)),
      rapid: Math.round((player.ratings.rapid || 0) - (prevRatings.rapid || 0)),
      blitz: Math.round((player.ratings.blitz || 0) - (prevRatings.blitz || 0)),
    }

    return {
      ...player,
      changes: {
        position: positionChange,
        points: pointsChange,
        ratings: ratingChanges,
        isNew: false
      }
    }
  })
}

export async function checkIfRecalculationNeeded(adminSupabase: SupabaseClient, currentMonth: number, currentYear: number): Promise<boolean> {
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (listError || !files) return false

    const rankingFiles = files
      .filter((file: any) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        !file.name.includes('-analytics') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: any) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        return {
          filename: file.name,
          date: new Date(parseInt(match[2]), parseInt(match[1]) - 1)
        }
      })
      .filter(Boolean)

    const currentDate = new Date(currentYear, currentMonth - 1)
    return rankingFiles.some((ranking: any) => ranking.date.getTime() > currentDate.getTime())
  } catch (error) {
    console.warn('Error checking recalculation need:', error)
    return false
  }
}
