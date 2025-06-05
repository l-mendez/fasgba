import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return handleError(new Error('Filename parameter is required'))
    }

    // Use admin client for storage operations (has service role permissions)
    const adminSupabase = createAdminClient()
    
    // Add .json extension if not present
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`
    
    console.log(`Fetching specific ranking: ${fullFilename}`)
    
    // Download the specific ranking file
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(fullFilename)
    
    if (downloadError || !fileData) {
      console.error('Failed to download ranking file:', downloadError)
      return handleError(new Error('Failed to download ranking file: ' + (downloadError?.message || 'Unknown error')))
    }

    const jsonContent = await fileData.text()
    const rankingData = JSON.parse(jsonContent)
    
    // Validate data structure
    if (!rankingData.players || !Array.isArray(rankingData.players)) {
      return handleError(new Error('Invalid ranking data structure'))
    }

    console.log(`Served ${rankingData.totalPlayers} players from ranking: ${rankingData.filename}`)
    return apiSuccess(rankingData)

  } catch (error) {
    console.error('Error fetching specific ranking:', error)
    return handleError(error)
  }
} 