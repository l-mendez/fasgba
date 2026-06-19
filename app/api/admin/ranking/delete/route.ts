import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateRankingCache } from '@/lib/cache/ranking'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'
import {
  checkIfLatestRanking,
  findNewLatestRanking,
  getRankingInfo,
  renameSameMonthRankings,
  recalculateNextRankingChanges
} from './service'

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

    // Delete the ranking file and its companion analytics file
    const analyticsFilename = fullFilename.replace('.json', '-analytics.json')
    const { error: deleteError } = await adminSupabase.storage
      .from('ranking-data')
      .remove([fullFilename, analyticsFilename])

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

    revalidateRankingCache()

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
