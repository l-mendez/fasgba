import { NextRequest } from 'next/server'
import { z } from 'zod'

import { applyCountryToggles } from '@/lib/admin/countryAccess'
import { CONTINENTS, type Continent } from '@/lib/countries'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

const bulkSchema = z.object({
  continent: z
    .string()
    .refine((value): value is Continent => value in CONTINENTS, 'Continente inválido'),
  enabled: z.boolean(),
})

/**
 * POST /api/admin/countries/bulk
 * Enables or disables every country of a continent. Protected, unchanged and
 * in-cooldown countries are skipped and reported instead of failing the batch.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 5)
  if (limited) return limited

  try {
    const user = await requireAdmin(request)

    const result = bulkSchema.safeParse(await request.json())
    if (!result.success) {
      return validationError(result.error.errors[0]?.message || 'Datos inválidos')
    }

    const { continent, enabled } = result.data
    const { updated, skipped, cooldownUntil } = await applyCountryToggles(
      createAdminClient(),
      [...CONTINENTS[continent].codes],
      enabled,
      user.email ?? null
    )

    return apiSuccess({
      continent,
      enabled,
      updated,
      skipped: skipped.filter((skip) => skip.reason !== 'unchanged'),
      unchangedCount: skipped.filter((skip) => skip.reason === 'unchanged').length,
      cooldownUntil,
    })
  } catch (error) {
    return handleError(error)
  }
}
