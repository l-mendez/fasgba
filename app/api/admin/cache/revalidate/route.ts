import { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/middleware/auth'
import { revalidateArbitrosCache } from '@/lib/cache/arbitros'
import { revalidateClubsCache } from '@/lib/cache/clubs'
import { revalidateDocumentosCache } from '@/lib/cache/documentos'
import { revalidateNewsCache } from '@/lib/cache/news'
import { revalidateProfesoresCache } from '@/lib/cache/profesores'
import { revalidateRankingCache } from '@/lib/cache/ranking'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { CACHE_SCOPES, type CacheScope } from '@/lib/cache/scopes'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

// Manual escape hatch: public pages are prerendered with `revalidate = false`,
// so content changed outside the app (Supabase dashboard, raw SQL, migrations,
// pnpm migrate:ranking) never reaches the site. This reuses the same
// invalidators the mutation routes call.
const INVALIDATORS: Record<CacheScope, () => void> = {
  news: revalidateNewsCache,
  clubs: revalidateClubsCache,
  torneos: revalidateTorneosCache,
  profesores: revalidateProfesoresCache,
  arbitros: revalidateArbitrosCache,
  documentos: revalidateDocumentosCache,
  ranking: revalidateRankingCache,
}

// z.enum rather than `scope in INVALIDATORS`: `'__proto__' in obj` is true, so a
// membership check would accept inherited keys and report a purge that never ran.
const bodySchema = z.object({
  scope: z.enum(['all', ...CACHE_SCOPES]).default('all'),
})

/**
 * POST /api/admin/cache/revalidate
 * Admin endpoint to purge the cache of the public pages.
 * Body (optional): { scope?: 'all' | CacheScope }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json().catch(() => ({}))
    const result = bodySchema.safeParse(body)

    if (!result.success) {
      return validationError('Ámbito de caché no válido')
    }

    const { scope } = result.data
    const scopes: readonly CacheScope[] = scope === 'all' ? CACHE_SCOPES : [scope]

    scopes.forEach((key) => INVALIDATORS[key]())

    return apiSuccess({ success: true, scopes })
  } catch (error) {
    return handleError(error)
  }
}
