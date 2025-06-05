import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { forceRankingCacheInvalidation } from '@/lib/rankingUtils'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { currentFilename, newMonth, newYear } = await request.json()
    
    if (!currentFilename || !newMonth || !newYear) {
      return handleError(new Error('Missing required fields: currentFilename, newMonth, newYear'))
    }

    // Validate month and year
    const month = parseInt(newMonth)
    const year = parseInt(newYear)
    
    if (month < 1 || month > 12) {
      return handleError(new Error('Month must be between 1 and 12'))
    }
    
    if (year < 2000 || year > 2100) {
      return handleError(new Error('Year must be between 2000 and 2100'))
    }

    const adminSupabase = createAdminClient()
    
    // Step 1: Get all ranking files to understand the current order
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      return handleError(new Error(`Failed to list ranking files: ${listError?.message || 'Unknown error'}`))
    }

    // Process and sort all rankings by chronological date
    const allRankings = files
      .filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('temp/') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const fileMonth = parseInt(match[1])
        const fileYear = parseInt(match[2])
        
        return {
          filename: file.name,
          baseFilename: file.name.replace('.json', ''),
          month: fileMonth,
          year: fileYear,
          date: new Date(fileYear, fileMonth - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by chronological date (oldest first)
        const dateComparison = (a?.date.getTime() || 0) - (b?.date.getTime() || 0)
        if (dateComparison !== 0) return dateComparison
        
        // For same month/year, sort by creation time (oldest first)
        return new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
      })

    // Find the ranking being moved
    const currentFullFilename = currentFilename.endsWith('.json') ? currentFilename : `${currentFilename}.json`
    const movingRankingIndex = allRankings.findIndex(r => r?.filename === currentFullFilename)
    
    if (movingRankingIndex === -1) {
      return handleError(new Error('Ranking not found'))
    }

    const movingRanking = allRankings[movingRankingIndex]
    
    // Step 2: Download the current ranking file
    const { data: currentFileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(currentFullFilename)
    
    if (downloadError || !currentFileData) {
      return handleError(new Error(`Failed to download current ranking: ${downloadError?.message || 'Unknown error'}`))
    }

    const currentRankingData = JSON.parse(await currentFileData.text())
    
    // Step 3: Generate new filename and check for conflicts
    const baseNewFilename = `ranking-${month.toString().padStart(2, '0')}-${year}`
    const existingFilenames = allRankings.map(r => r?.baseFilename || '').filter(Boolean)
    
    let newFilename = baseNewFilename
    let counter = 2
    
    while (existingFilenames.includes(newFilename) && newFilename !== movingRanking?.baseFilename) {
      newFilename = `${baseNewFilename} (${counter})`
      counter++
    }
    
    // Step 4: Update the ranking data with new date
    const updatedRankingData = {
      ...currentRankingData,
      filename: newFilename,
      month: month,
      year: year,
      lastUpdated: new Date().toISOString()
    }
    
    // Step 5: Calculate new chronological position
    const newDate = new Date(year, month - 1)
    const tempRankingInfo = {
      filename: `${newFilename}.json`,
      baseFilename: newFilename,
      month: month,
      year: year,
      date: newDate,
      created_at: movingRanking?.created_at || new Date().toISOString()
    }
    
    // Create new order with the moved ranking
    const otherRankings = allRankings.filter((_, index) => index !== movingRankingIndex)
    const newOrder = [...otherRankings, tempRankingInfo].sort((a, b) => {
      const dateComparison = (a?.date.getTime() || 0) - (b?.date.getTime() || 0)
      if (dateComparison !== 0) return dateComparison
      return new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
    })
    
    const newPosition = newOrder.findIndex(r => r?.baseFilename === newFilename)
    
    // Step 6: Update affected rankings
    // Create the original order for comparison (without the moved ranking)
    const originalOrder = allRankings.map(r => r?.baseFilename).filter(Boolean)
    const newOrderFilenames = newOrder.map(r => r?.baseFilename).filter(Boolean)
    
    console.log(`Updating ranking date: ${currentFilename} from position ${movingRankingIndex} to ${newPosition}`)
    console.log('Original order:', originalOrder)
    console.log('New order:', newOrderFilenames)
    
    const rankingsToUpdate = []
    
    // Find all rankings that had their previous ranking change
    for (let i = 0; i < newOrder.length; i++) {
      const currentRanking = newOrder[i]
      if (!currentRanking || currentRanking.baseFilename === newFilename) {
        continue // Skip the moved ranking itself, we'll handle it separately
      }
      
      // Calculate what the previous ranking should be in the new order
      const newPreviousRanking = i > 0 ? newOrder[i - 1]?.baseFilename || null : null
      
      // Find what the previous ranking was in the original order
      const originalIndex = originalOrder.indexOf(currentRanking.baseFilename)
      const originalPreviousRanking = originalIndex > 0 ? originalOrder[originalIndex - 1] : null
      
      // If the previous ranking changed, this ranking needs to be updated
      if (newPreviousRanking !== originalPreviousRanking) {
        console.log(`${currentRanking.baseFilename}: previous ranking changed from "${originalPreviousRanking}" to "${newPreviousRanking}"`)
        rankingsToUpdate.push({
          filename: currentRanking.filename,
          newPreviousRanking: newPreviousRanking
        })
      }
    }
    
    console.log(`Will update ${rankingsToUpdate.length} affected rankings`)

    // Handle the moved ranking itself
    const newPreviousRanking = newPosition > 0 ? newOrder[newPosition - 1]?.baseFilename || null : null
    updatedRankingData.previousRanking = newPreviousRanking
    
    // Recalculate position differences for the moved ranking
    updatedRankingData.players = await recalculatePlayerDifferences(
      currentRankingData.players,
      newPreviousRanking,
      adminSupabase
    )
    
    // Step 7: Upload the updated ranking with new filename
    const jsonBuffer = Buffer.from(JSON.stringify(updatedRankingData, null, 2))
    
    const { error: uploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(`${newFilename}.json`, jsonBuffer, {
        contentType: 'application/json',
        upsert: false
      })
    
    if (uploadError) {
      return handleError(new Error(`Failed to upload updated ranking: ${uploadError.message}`))
    }
    
    // Step 8: Update the affected rankings
    for (const rankingUpdate of rankingsToUpdate) {
      try {
        const { data: rankingFileData, error: downloadErr } = await adminSupabase.storage
          .from('ranking-data')
          .download(rankingUpdate.filename)
        
        if (downloadErr || !rankingFileData) {
          console.warn(`Failed to download ${rankingUpdate.filename} for update:`, downloadErr?.message)
          continue
        }
        
        const rankingData = JSON.parse(await rankingFileData.text())
        
        // Always recalculate position differences when previous ranking changes
        const updatedPlayers = await recalculatePlayerDifferences(
          rankingData.players,
          rankingUpdate.newPreviousRanking,
          adminSupabase
        )
        
        const updatedData = {
          ...rankingData,
          previousRanking: rankingUpdate.newPreviousRanking,
          players: updatedPlayers,
          lastUpdated: new Date().toISOString()
        }
        
        const updateBuffer = Buffer.from(JSON.stringify(updatedData, null, 2))
        await adminSupabase.storage
          .from('ranking-data')
          .upload(rankingUpdate.filename, updateBuffer, {
            contentType: 'application/json',
            upsert: true
          })
          
        console.log(`Updated ${rankingUpdate.filename} with new previous ranking: ${rankingUpdate.newPreviousRanking}`)
      } catch (updateError) {
        console.warn(`Failed to update ${rankingUpdate.filename}:`, updateError)
      }
    }
    
    // Step 9: Delete the old file (only if the filename changed)
    if (currentFullFilename !== `${newFilename}.json`) {
      const { error: deleteError } = await adminSupabase.storage
        .from('ranking-data')
        .remove([currentFullFilename])
      
      if (deleteError) {
        console.warn(`Warning: Failed to delete old file ${currentFullFilename}:`, deleteError.message)
      }
    }
    
    // Step 10: Force cache invalidation to ensure fresh data
    forceRankingCacheInvalidation()
    
    return apiSuccess({
      message: 'Ranking date updated successfully',
      oldFilename: currentFilename,
      newFilename: newFilename,
      newMonth: month,
      newYear: year,
      affectedRankings: rankingsToUpdate.length + 1 // Include the moved ranking itself
    })

  } catch (error) {
    console.error('Error updating ranking date:', error)
    return handleError(error)
  }
}

/**
 * Recalculates player position differences for a specific ranking
 */
async function recalculatePlayerDifferences(players: any[], previousRankingFilename: string | null, adminSupabase: any) {
  if (!previousRankingFilename) {
    // No previous ranking - all players are new
    return players.map(player => ({
      ...player,
      changes: {
        position: null,
        points: player.points,
        isNew: true
      }
    }))
  }
  
  try {
    // Download the previous ranking
    const { data: prevFileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(`${previousRankingFilename}.json`)
    
    if (downloadError || !prevFileData) {
      console.warn(`Failed to download previous ranking ${previousRankingFilename}:`, downloadError?.message)
      // Fallback: treat all players as new
      return players.map(player => ({
        ...player,
        changes: {
          position: null,
          points: player.points,
          isNew: true
        }
      }))
    }
    
    const previousRankingData = JSON.parse(await prevFileData.text())
    
    // Calculate differences
    return players.map(currentPlayer => {
      const previousPlayer = previousRankingData.players.find((p: any) => p.name === currentPlayer.name)
      
      if (!previousPlayer) {
        // New player
        return {
          ...currentPlayer,
          changes: {
            position: null,
            points: currentPlayer.points,
            isNew: true
          }
        }
      } else {
        // Existing player
        const positionChange = previousPlayer.position - currentPlayer.position // positive = moved up
        const pointsChange = currentPlayer.points - previousPlayer.points
        
        return {
          ...currentPlayer,
          changes: {
            position: positionChange,
            points: pointsChange,
            isNew: false
          }
        }
      }
    })
    
  } catch (error) {
    console.error('Error recalculating player differences:', error)
    // Fallback: return original players
    return players
  }
} 