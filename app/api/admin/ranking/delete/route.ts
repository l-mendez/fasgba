import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'
import { clearRankingCache } from '@/lib/rankingUtils'

interface RankingFileInfo {
  filename: string
  month: number
  year: number
  date: Date
  created_at?: string
}

interface RankingFileInfoWithBase extends RankingFileInfo {
  baseFilename: string
}

interface SameMonthRankingInfo {
  originalFilename: string
  baseFilename: string
  month: number
  year: number
  suffix: string
  created_at?: string
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has admin permissions - use regular client for auth check
    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return forbiddenError('Admin access required')
    }

    // Use admin client for storage operations
    const adminSupabase = createAdminClient()

    const { filename } = await request.json()
    
    if (!filename) {
      return handleError(new Error('Filename is required'))
    }

    // Add .json extension if not present
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    
    // Get information about the ranking being deleted
    const deletedRankingInfo = await getRankingInfo(adminSupabase, filename)
    if (!deletedRankingInfo) {
      return handleError(new Error('Ranking not found'))
    }

    // Check if this is the chronologically latest ranking
    const wasLatestRanking = await checkIfLatestRanking(adminSupabase, filename)

    // Delete the ranking file
    const { error: deleteError } = await adminSupabase.storage
      .from('ranking-data')
      .remove([fullFilename])
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return handleError(new Error('Failed to delete ranking: ' + deleteError.message))
    }

    // Handle renaming of same-month rankings
    await renameSameMonthRankings(adminSupabase, deletedRankingInfo.month, deletedRankingInfo.year)

    // Recalculate only the immediate next ranking (not cascade)
    await recalculateNextRankingChanges(adminSupabase, deletedRankingInfo)

    // If we deleted the latest ranking, determine the new latest
    let newLatestRanking = null
    if (wasLatestRanking) {
      newLatestRanking = await findNewLatestRanking(adminSupabase)
    }

    // Clear ranking cache to ensure fresh data
    clearRankingCache()

    return apiSuccess({
      filename,
      message: 'Ranking deleted successfully',
      wasLatestRanking,
      newLatestRanking,
      renamedSameMonthRankings: true,
      recalculatedNextRanking: true
    })

  } catch (error) {
    console.error('Error deleting ranking:', error)
    return handleError(error)
  }
}

// Helper function to check if the ranking being deleted is the chronologically latest
async function checkIfLatestRanking(adminSupabase: any, filenameToDelete: string): Promise<boolean> {
  try {
    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      return false
    }

    // Filter and find the chronologically latest ranking
    const rankingFiles = (files
      .filter((file: { name: string }) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: { name: string; created_at?: string }) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null

        const month = parseInt(match[1])
        const year = parseInt(match[2])

        return {
          filename: file.name.replace('.json', ''),
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean) as RankingFileInfo[])
      .sort((a: RankingFileInfo, b: RankingFileInfo) => {
        // First sort by chronological date (most recent first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // For same month/year, sort by creation time (most recent first)
        // This ensures higher numbered versions (created later) come first
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }); // Sort by chronological date, most recent first

    if (rankingFiles.length === 0) {
      return false
    }

    const latestRanking = rankingFiles[0]
    return latestRanking.filename === filenameToDelete

  } catch (error) {
    console.warn('Error checking if latest ranking:', error)
    return false
  }
}

// Helper function to find the new chronologically latest ranking after deletion
async function findNewLatestRanking(adminSupabase: any): Promise<string | null> {
  try {
    // List all ranking files again (after deletion)
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      return null
    }

    // Filter and find the chronologically latest ranking
    const rankingFiles = (files
      .filter((file: { name: string }) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: { name: string; created_at?: string }) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null

        const month = parseInt(match[1])
        const year = parseInt(match[2])

        return {
          filename: file.name.replace('.json', ''),
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean) as RankingFileInfo[])
      .sort((a: RankingFileInfo, b: RankingFileInfo) => {
        // First sort by chronological date (most recent first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // For same month/year, sort by creation time (most recent first)
        // This ensures higher numbered versions (created later) come first
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }); // Sort by chronological date, most recent first

    if (rankingFiles.length === 0) {
      return null
    }

    const newLatestRanking = rankingFiles[0]
    return newLatestRanking.filename

  } catch (error) {
    console.warn('Error finding new latest ranking:', error)
    return null
  }
}

// Helper function to get information about the ranking being deleted
async function getRankingInfo(adminSupabase: any, filename: string) {
  try {
    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      return null
    }

    // Filter and find the ranking being deleted
    const rankingFiles = (files
      .filter((file: { name: string }) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: { name: string; created_at?: string }) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null

        const month = parseInt(match[1])
        const year = parseInt(match[2])

        return {
          filename: file.name.replace('.json', ''),
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean) as RankingFileInfo[])
      .sort((a: RankingFileInfo, b: RankingFileInfo) => {
        // First sort by chronological date (most recent first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // For same month/year, sort by creation time (most recent first)
        // This ensures higher numbered versions (created later) come first
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }); // Sort by chronological date, most recent first

    if (rankingFiles.length === 0) {
      return null
    }

    const ranking = rankingFiles.find((file: RankingFileInfo) => file.filename === filename)
    if (!ranking) {
      return null
    }

    return {
      month: ranking.month,
      year: ranking.year
    }

  } catch (error) {
    console.warn('Error getting ranking info:', error)
    return null
  }
}

// Helper function to handle renaming of same-month rankings
async function renameSameMonthRankings(adminSupabase: any, deletedMonth: number, deletedYear: number) {
  try {    
    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError || !files) {
      return
    }

    // Filter and find same-month rankings
    const sameMonthRankings = (files
      .filter((file: { name: string }) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: { name: string; created_at?: string }) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4})(.*)\.json$/)
        if (!match) return null

        const month = parseInt(match[1])
        const year = parseInt(match[2])
        const suffix = match[3] // captures " (2)", " (3)", etc.

        return {
          originalFilename: file.name,
          baseFilename: file.name.replace('.json', ''),
          month,
          year,
          suffix,
          created_at: file.created_at
        }
      })
      .filter(Boolean) as SameMonthRankingInfo[])
      .filter((ranking: SameMonthRankingInfo) => ranking.month === deletedMonth && ranking.year === deletedYear)
      .sort((a: SameMonthRankingInfo, b: SameMonthRankingInfo) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()); // Sort by creation time

    if (sameMonthRankings.length === 0) {
      return
    }

    // Rename rankings to remove gaps in numbering
    const renamedRankings = []
    for (let i = 0; i < sameMonthRankings.length; i++) {
      const ranking = sameMonthRankings[i]
      const newNumber = i + 1
      
      let newFilename
      if (newNumber === 1) {
        // First ranking doesn't need a number suffix
        newFilename = `ranking-${String(deletedMonth).padStart(2, '0')}-${deletedYear}.json`
      } else {
        // Subsequent rankings get (2), (3), etc.
        newFilename = `ranking-${String(deletedMonth).padStart(2, '0')}-${deletedYear} (${newNumber}).json`
      }

      if (ranking.originalFilename !== newFilename) {        
        // First, download the existing file content
        const { data: fileData, error: downloadError } = await adminSupabase.storage
          .from('ranking-data')
          .download(ranking.originalFilename)
          
        if (downloadError || !fileData) {
          console.error(`Failed to download ${ranking.originalFilename} for renaming:`, downloadError)
          continue
        }

        // Parse and update the JSON content
        const jsonContent = await fileData.text()
        const rankingData = JSON.parse(jsonContent)
        
        // Update the filename in the JSON content
        const newBaseFilename = newFilename.replace('.json', '')
        rankingData.filename = newBaseFilename
        rankingData.lastUpdated = new Date().toISOString()
        
        // Convert back to JSON
        const updatedJsonContent = JSON.stringify(rankingData, null, 2)
        
        // Upload the file with the new name and updated content
        const { error: uploadError } = await adminSupabase.storage
          .from('ranking-data')
          .upload(newFilename, updatedJsonContent, {
            contentType: 'application/json',
            upsert: false
          })
          
        if (uploadError) {
          console.error(`Failed to upload renamed file ${newFilename}:`, uploadError)
          continue
        }
        
        // Delete the old file
        const { error: deleteError } = await adminSupabase.storage
          .from('ranking-data')
          .remove([ranking.originalFilename])
          
        if (deleteError) {
          console.error(`Failed to delete old file ${ranking.originalFilename}:`, deleteError)
        } else {
          renamedRankings.push({ from: ranking.originalFilename, to: newFilename })
        }
      }
    }

  } catch (error) {
    console.warn('Error renaming same-month rankings:', error)
  }
}

// Helper function to find the next ranking chronologically and recalculate its changes
async function recalculateNextRankingChanges(adminSupabase: any, deletedRankingInfo: { month: number; year: number }) {
  try {

    // List all ranking files
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      return
    }

    // Filter and sort all rankings chronologically
    const allRankings = (files
      .filter((file: { name: string }) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: { name: string; created_at?: string }) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null

        const month = parseInt(match[1])
        const year = parseInt(match[2])

        return {
          filename: file.name,
          baseFilename: file.name.replace('.json', ''),
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean) as RankingFileInfoWithBase[])
      .sort((a: RankingFileInfoWithBase, b: RankingFileInfoWithBase) => a.date.getTime() - b.date.getTime()); // Sort chronologically (oldest first)

    // Find the ranking that comes after the deleted one chronologically
    const deletedDate = new Date(deletedRankingInfo.year, deletedRankingInfo.month - 1)
    const nextRanking = allRankings.find((ranking: RankingFileInfoWithBase) => ranking.date.getTime() > deletedDate.getTime())

    if (!nextRanking) {
      return
    }

    // Find the new previous ranking (the one before the deleted ranking)
    const previousRanking = allRankings
      .filter((ranking: RankingFileInfoWithBase) => ranking.date.getTime() < deletedDate.getTime())
      .sort((a: RankingFileInfoWithBase, b: RankingFileInfoWithBase) => {
        // First sort by chronological date (most recent first)
        const dateComparison = b.date.getTime() - a.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // For same month/year, sort by creation time (most recent first)
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      })[0] // Most recent before deleted

    // Download the next ranking data
    const { data: nextRankingData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(nextRanking.filename)

    if (downloadError || !nextRankingData) {
      console.error('Failed to download next ranking for recalculation:', downloadError)
      return
    }

    const nextRankingJson = JSON.parse(await nextRankingData.text())

    // Download the new previous ranking data (if exists)
    let previousRankingJson = null
    if (previousRanking) {
      const { data: prevData, error: prevError } = await adminSupabase.storage
        .from('ranking-data')
        .download(previousRanking.filename)

      if (!prevError && prevData) {
        previousRankingJson = JSON.parse(await prevData.text())
      }
    }

    // Helper function to normalize names for comparison
    const normalizeName = (name: string): string => {
      return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // Recalculate changes for each player
    const updatedPlayers = nextRankingJson.players.map((player: any) => {
      let changes: { position: number | null; points: number; isNew: boolean } = {
        position: null,
        points: 0,
        isNew: false
      }

      if (previousRankingJson) {
        const previousPlayer = previousRankingJson.players.find((p: any) => 
          normalizeName(p.name) === normalizeName(player.name)
        )
        
        if (previousPlayer) {
          // Calculate position change
          changes.position = previousPlayer.position - player.position // positive = moved up
          changes.points = player.points - previousPlayer.points
          changes.isNew = false
        } else {
          // New player
          changes.position = null
          changes.points = player.points
          changes.isNew = true
        }
      } else {
        // No previous ranking, so all players are "new"
        changes.position = null
        changes.points = player.points
        changes.isNew = true
      }

      return {
        ...player,
        changes
      }
    })

    // Update the ranking with recalculated changes
    const updatedRankingData = {
      ...nextRankingJson,
      players: updatedPlayers,
      previousRanking: previousRanking ? previousRanking.baseFilename : null,
      lastUpdated: new Date().toISOString()
    }

    // Upload the updated ranking
    const updatedJsonBuffer = Buffer.from(JSON.stringify(updatedRankingData, null, 2))
    const { error: uploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(nextRanking.filename, updatedJsonBuffer, {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload recalculated ranking:', uploadError)
    }

  } catch (error) {
    console.warn('Error recalculating next ranking:', error)
  }
} 