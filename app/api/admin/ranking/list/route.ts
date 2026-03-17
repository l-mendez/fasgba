import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
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

    // Use admin client for storage operations (has service role permissions)
    const adminSupabase = createAdminClient()
    
    // List all files in the ranking-data bucket (excluding temp folder)
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError) {
      console.error('Failed to list ranking files:', listError)
      return handleError(new Error('Failed to list ranking files: ' + listError.message))
    }

    // Filter and process ranking files (exclude temp files and non-JSON)
    const filteredFiles = files.filter(file =>
      file.name.endsWith('.json') &&
      !file.name.startsWith('temp/') &&
      !file.name.includes('-analytics') &&
      file.name.match(/^ranking-\d{2}-\d{4}/)
    )

    // Process ranking files
    const rankings = await Promise.all(
      filteredFiles
        .map(async (file) => {
          try {
            // Extract date info from filename
            const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
            if (!match) return null

            const month = parseInt(match[1])
            const year = parseInt(match[2])

            // Try to get additional info from the JSON file using admin client
            const { data: fileData, error: downloadError } = await adminSupabase.storage
              .from('ranking-data')
              .download(file.name)

            let totalPlayers = 0
            let lastUpdated = file.created_at

            if (!downloadError && fileData) {
              try {
                const jsonContent = await fileData.text()
                const rankingData = JSON.parse(jsonContent)
                totalPlayers = rankingData.totalPlayers || rankingData.players?.length || 0
                lastUpdated = rankingData.lastUpdated || file.created_at
              } catch (e) {
                // If we can't parse, use default values
                console.warn(`Could not parse ranking file ${file.name}:`, e)
              }
            }

            const monthNames = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ]

            return {
              id: file.name.replace('.json', ''), // Use filename without extension as ID
              name: file.name.replace('.json', ''),
              date: lastUpdated,
              totalPlayers,
              status: 'archived', // We'll determine current status separately
              month,
              year,
              filePath: file.name,
              size: file.metadata?.size || 0,
              baseDisplayName: `${monthNames[month - 1]} ${year}`,
              chronologicalDate: new Date(year, month - 1)
            }
          } catch (e) {
            console.warn(`Error processing file ${file.name}:`, e)
            return null
          }
        })
    )

    // Filter out null results and sort by chronological date (newest first)
    const validRankings = rankings
      .filter(ranking => ranking !== null)
      .sort((a, b) => {
        // First sort by chronological date (most recent first)
        const dateComparison = b.chronologicalDate.getTime() - a.chronologicalDate.getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // For same month/year, sort by creation time (most recent first)
        // This ensures higher numbered versions (created later) come first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })

    // Handle duplicate months by adding (2), (3), etc. based on creation order
    const monthYearGroups = new Map<string, any[]>();
    
    // Group rankings by month/year
    validRankings.forEach(ranking => {
      const monthYearKey = `${ranking.month}-${ranking.year}`;
      if (!monthYearGroups.has(monthYearKey)) {
        monthYearGroups.set(monthYearKey, []);
      }
      monthYearGroups.get(monthYearKey)!.push(ranking);
    });
    
    // Process each group to assign correct display names
    const processedRankings = validRankings.map(ranking => {
      const monthYearKey = `${ranking.month}-${ranking.year}`;
      const sameMonthRankings = monthYearGroups.get(monthYearKey)!;
      
      if (sameMonthRankings.length === 1) {
        // Only one ranking for this month/year
        return {
          ...ranking,
          displayName: ranking.baseDisplayName
        };
      }
      
      // Multiple rankings for same month/year - sort by creation time (oldest first)
      const sortedSameMonth = [...sameMonthRankings].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Find the position of current ranking in creation order
      const positionInCreationOrder = sortedSameMonth.findIndex(r => r.name === ranking.name);
      
      const displayName = positionInCreationOrder === 0 
        ? ranking.baseDisplayName 
        : `${ranking.baseDisplayName} (${positionInCreationOrder + 1})`;
      
      return {
        ...ranking,
        displayName
      };
    });

    // Mark the chronologically most recent one as current
    if (processedRankings.length > 0) {
      processedRankings[0].status = 'current'
    }

    return apiSuccess({
      rankings: processedRankings,
      total: processedRankings.length
    })

  } catch (error) {
    return handleError(error)
  }
} 