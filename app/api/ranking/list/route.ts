import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Use admin client for storage operations (has service role permissions)
    const adminSupabase = createAdminClient()
        
    // List all ranking files
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

    // Filter and process ranking files
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
        const monthNames = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]
        
        return {
          filename: file.name.replace('.json', ''),
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at,
          baseDisplayName: `${monthNames[month - 1]} ${year}`
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
      });

    // Handle duplicate months by adding (2), (3), etc.
    const monthYearCounts = new Map<string, number>();
    const processedRankings = rankingFiles.map(ranking => {
      if (!ranking) return null;
      const monthYearKey = `${ranking.month}-${ranking.year}`;
      const currentCount = monthYearCounts.get(monthYearKey) || 0;
      monthYearCounts.set(monthYearKey, currentCount + 1);
      
      const displayName = currentCount === 0 
        ? ranking.baseDisplayName 
        : `${ranking.baseDisplayName} (${currentCount + 1})`;
      
      return {
        filename: ranking.filename,
        displayName,
        month: ranking.month,
        year: ranking.year,
        date: ranking.date
      };
    }).filter(Boolean);

    return apiSuccess(processedRankings)

  } catch (error) {
    console.error('Error listing rankings:', error)
    return handleError(error)
  }
} 