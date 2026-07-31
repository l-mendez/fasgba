import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { applyCountryToggles, buildCountriesOverview } from '@/lib/admin/countryAccess'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, forbiddenError, handleError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

const toggleSchema = z.object({
  country_code: z.string().regex(/^[A-Za-z]{2}$/, 'Código de país inválido'),
  enabled: z.boolean(),
})

/**
 * GET /api/admin/countries
 * Country allowlist overview: state, last change, cooldown and 7-day traffic.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60)
  if (limited) return limited

  try {
    await requireAdmin(request)
    const overview = await buildCountriesOverview(createAdminClient())
    return apiSuccess(overview)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/countries
 * Enables or disables a single country.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 20)
  if (limited) return limited

  try {
    const user = await requireAdmin(request)

    const result = toggleSchema.safeParse(await request.json())
    if (!result.success) {
      return validationError(result.error.errors[0]?.message || 'Datos inválidos')
    }

    const code = result.data.country_code.toUpperCase()
    const { enabled } = result.data

    const supabase = createAdminClient()
    const { updated, skipped, cooldownUntil } = await applyCountryToggles(
      supabase,
      [code],
      enabled,
      user.email ?? null
    )

    const skip = skipped[0]

    if (skip?.reason === 'protected') {
      return forbiddenError('Argentina no puede deshabilitarse')
    }

    if (skip?.reason === 'cooldown') {
      return NextResponse.json(
        {
          error: 'Este país se modificó hace poco. Esperá unos minutos.',
          code: 'COOLDOWN',
          retryAfterSeconds: skip.retryAfterSeconds ?? 0,
        },
        { status: 429, headers: { 'Retry-After': String(skip.retryAfterSeconds ?? 0) } }
      )
    }

    if (skip?.reason === 'invalid') {
      return validationError('Código de país inválido')
    }

    return apiSuccess({
      code,
      enabled,
      changed: updated.length > 0,
      cooldownUntil: cooldownUntil[code] ?? null,
    })
  } catch (error) {
    return handleError(error)
  }
}
