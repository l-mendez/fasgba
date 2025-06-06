import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Use admin client for storage operations (has service role permissions)
    const adminSupabase = createAdminClient()
    
    // List all ranking files to find the chronologically latest one
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      console.error('Failed to list ranking files:', listError)
      return handleError(new Error('Failed to list ranking files: ' + (listError?.message || 'Unknown error')))
    }

    // Filter and find the chronologically latest ranking file (by date in filename, not upload time)
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
          date: new Date(year, month - 1), // month - 1 because Date months are 0-indexed
          created_at: file.created_at
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // First sort by chronological date (most recent first)
        const dateComparison = (b?.date.getTime() || 0) - (a?.date.getTime() || 0);
        if (dateComparison !== 0) return dateComparison;
        
        // For same month/year, sort by creation time (most recent first)
        // This ensures higher numbered versions (created later) come first
        return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
      }); // Sort to get the latest version

    if (rankingFiles.length === 0) {
      return handleError(new Error('No ranking files found'))
    }

    const latestFile = rankingFiles[0]
    if (!latestFile) {
      return handleError(new Error('No valid ranking files found'))
    }

    // Download the latest ranking file
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(latestFile.filename)
    
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

    return apiSuccess(rankingData)

  } catch (error) {
    console.error('Error fetching latest ranking:', error)
    return handleError(error)
  }
} 