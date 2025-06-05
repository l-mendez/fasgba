import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'

export async function POST(request: NextRequest) {
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

    const { tempJsonPath, filename } = await request.json()
    
    if (!tempJsonPath || !filename) {
      return handleError(new Error('Missing required parameters'))
    }

    // Download the temp JSON file using admin client
    const { data: tempFile, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(tempJsonPath)
    
    if (downloadError) {
      console.error('Download error:', downloadError)
      return handleError(new Error('Failed to retrieve temp ranking data'))
    }

    // Get the JSON content
    const jsonContent = await tempFile.text()
    const rankingData = JSON.parse(jsonContent)

    // Upload to final location using admin client
    const finalPath = `${filename}.json`
    const { error: uploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(finalPath, jsonContent, {
        contentType: 'application/json',
        upsert: false // Don't overwrite existing files - this ensures numbered filenames work correctly
      })
    
    if (uploadError) {
      console.error('Final upload error:', uploadError)
      return handleError(new Error('Failed to save ranking data'))
    }

    // Clean up temp file using admin client
    await adminSupabase.storage.from('ranking-data').remove([tempJsonPath])

    // If this is a past ranking upload, recalculate subsequent rankings
    const needsRecalculation = await checkIfRecalculationNeeded(adminSupabase, rankingData.month, rankingData.year)
    
    if (needsRecalculation) {
      console.log('Recalculating subsequent rankings...')
      await recalculateSubsequentRankings(adminSupabase, rankingData.month, rankingData.year)
    }

    // Get public URL for the saved file
    const { data: urlData } = adminSupabase.storage
      .from('ranking-data')
      .getPublicUrl(finalPath)

    return apiSuccess({
      filename: filename,
      finalPath,
      publicUrl: urlData.publicUrl,
      message: needsRecalculation ? 
        'Ranking saved successfully and subsequent rankings recalculated' : 
        'Ranking saved successfully'
    })

  } catch (error) {
    return handleError(error)
  }
}

// Helper function to check if recalculation is needed (same as in upload route)
async function checkIfRecalculationNeeded(adminSupabase: any, currentMonth: number, currentYear: number): Promise<boolean> {
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError || !files) {
      return false
    }

    const rankingFiles = files
      .filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        
        return {
          filename: file.name,
          month,
          year,
          date: new Date(year, month - 1)
        }
      })
      .filter(Boolean)

    const currentDate = new Date(currentYear, currentMonth - 1)
    const subsequentRankings = rankingFiles.filter(ranking => 
      ranking.date.getTime() > currentDate.getTime()
    )

    return subsequentRankings.length > 0
  } catch (error) {
    console.warn('Error checking recalculation need:', error)
    return false
  }
}

// Helper function to recalculate all rankings that come after the newly uploaded one
async function recalculateSubsequentRankings(adminSupabase: any, newRankingMonth: number, newRankingYear: number) {
  try {
    // Get all ranking files sorted chronologically
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError || !files) {
      console.error('Failed to list files for recalculation:', listError)
      return
    }

    const rankingFiles = files
      .filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        
        return {
          filename: file.name,
          month,
          year,
          date: new Date(year, month - 1)
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Chronological order

    const newRankingDate = new Date(newRankingYear, newRankingMonth - 1)
    
    // Find all rankings that come after the newly uploaded one
    const subsequentRankings = rankingFiles.filter(ranking => 
      ranking.date.getTime() > newRankingDate.getTime()
    )

    // Recalculate each subsequent ranking
    for (const ranking of subsequentRankings) {
      console.log(`Recalculating changes for ${ranking.filename}`)
      
      // Download the ranking file
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(ranking.filename)
      
      if (downloadError || !fileData) {
        console.warn(`Could not download ${ranking.filename} for recalculation`)
        continue
      }

      const rankingData = JSON.parse(await fileData.text())
      
      // Find the previous ranking (chronologically before this one)
      const previousRanking = await findPreviousRankingForRecalculation(
        adminSupabase, 
        ranking.month, 
        ranking.year, 
        rankingFiles
      )
      
      // Recalculate changes
      let updatedPlayers
      if (previousRanking) {
        updatedPlayers = calculatePlayerChangesForRecalculation(rankingData.players, previousRanking.players)
        rankingData.previousRanking = previousRanking.filename
      } else {
        // No previous ranking - mark all as new
        updatedPlayers = rankingData.players.map(player => ({
          ...player,
          changes: {
            position: null,
            points: 0,
            isNew: true
          }
        }))
        rankingData.previousRanking = null
      }
      
      // Update the ranking data
      rankingData.players = updatedPlayers
      rankingData.lastUpdated = new Date().toISOString()
      
      // Upload the updated ranking
      const updatedJsonBuffer = Buffer.from(JSON.stringify(rankingData, null, 2))
      const { error: uploadError } = await adminSupabase.storage
        .from('ranking-data')
        .upload(ranking.filename, updatedJsonBuffer, {
          contentType: 'application/json',
          upsert: true
        })
      
      if (uploadError) {
        console.error(`Failed to update ${ranking.filename}:`, uploadError)
      } else {
        console.log(`Successfully recalculated ${ranking.filename}`)
      }
    }
  } catch (error) {
    console.error('Error during recalculation:', error)
  }
}

// Helper function to find previous ranking for recalculation
async function findPreviousRankingForRecalculation(adminSupabase: any, currentMonth: number, currentYear: number, allRankings: any[]) {
  const currentDate = new Date(currentYear, currentMonth - 1)
  
  // Find the most recent ranking before the current one
  const previousRanking = allRankings
    .filter(ranking => ranking.date.getTime() < currentDate.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0] // Most recent first
  
  if (!previousRanking) {
    return null
  }

  try {
    // Download and parse the previous ranking
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(previousRanking.filename)
    
    if (downloadError || !fileData) {
      return null
    }

    const jsonContent = await fileData.text()
    const previousData = JSON.parse(jsonContent)
    
    return {
      filename: previousRanking.filename.replace('.json', ''),
      players: previousData.players || []
    }
  } catch (error) {
    console.warn('Error loading previous ranking for recalculation:', error)
    return null
  }
}

// Helper function to calculate changes (same logic as in upload route)
function calculatePlayerChangesForRecalculation(newPlayers: any[], previousPlayers: any[]) {
  return newPlayers.map(player => {
    // Find player in previous ranking (case-insensitive name matching)
    const previousPlayer = previousPlayers.find(p => 
      p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
    )

    if (!previousPlayer) {
      // New player
      return {
        ...player,
        changes: {
          position: null,
          points: 0,
          isNew: true
        }
      }
    }

    // Calculate changes
    const positionChange = previousPlayer.position - player.position
    const pointsChange = player.points - previousPlayer.points

    return {
      ...player,
      changes: {
        position: positionChange,
        points: pointsChange,
        isNew: false
      }
    }
  })
} 