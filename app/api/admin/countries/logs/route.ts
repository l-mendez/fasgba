import { NextRequest } from 'next/server'

import { COUNTRY_LOGS_PAGE_SIZE, fetchCountryLogs } from '@/lib/admin/countryAccess'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/countries/logs?country=XX&limit=20&offset=0
 * Country access audit trail, newest first.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60)
  if (limited) return limited

  try {
    await requireAdmin(request)

    const params = request.nextUrl.searchParams
    const country = params.get('country')?.toUpperCase() || undefined
    const limit = Math.min(Number(params.get('limit')) || COUNTRY_LOGS_PAGE_SIZE, 100)
    const offset = Math.max(Number(params.get('offset')) || 0, 0)

    if (country && !/^[A-Z]{2}$/.test(country)) {
      return validationError('Código de país inválido')
    }

    const logs = await fetchCountryLogs(createAdminClient(), { country, limit, offset })

    return apiSuccess({ logs, hasMore: logs.length === limit })
  } catch (error) {
    return handleError(error)
  }
}
