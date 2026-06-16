import { NextRequest } from 'next/server'

import { ADMIN_RANKINGS_PAGE_SIZE, getCachedAdminRankingSummaries, paginateRankings } from '@/lib/rankingStorage'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, forbiddenError, handleError } from '@/lib/utils/apiResponse'

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !adminData) {
      return forbiddenError('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get('pageSize'), ADMIN_RANKINGS_PAGE_SIZE),
      50
    )

    const rankings = await getCachedAdminRankingSummaries()

    return apiSuccess({
      ...paginateRankings(rankings, page, pageSize),
      existingRankingNames: rankings.map((ranking) => ranking.name),
    })
  } catch (error) {
    return handleError(error)
  }
}
