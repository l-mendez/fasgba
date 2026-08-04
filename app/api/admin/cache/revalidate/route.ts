import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { revalidateArbitrosCache } from '@/lib/cache/arbitros'
import { revalidateClubsCache } from '@/lib/cache/clubs'
import { revalidateDocumentosCache } from '@/lib/cache/documentos'
import { revalidateNewsCache } from '@/lib/cache/news'
import { revalidateProfesoresCache } from '@/lib/cache/profesores'
import { revalidateRankingCache } from '@/lib/cache/ranking'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

// Manual escape hatch: public pages are prerendered with `revalidate = false`,
// so content changed outside the app (Supabase dashboard, raw SQL, migrations,
// pnpm migrate:ranking) never reaches the site. This reuses the same
// invalidators the mutation routes call.
const INVALIDATORS: Record<string, () => void> = {
  news: revalidateNewsCache,
  clubs: revalidateClubsCache,
  torneos: revalidateTorneosCache,
  profesores: revalidateProfesoresCache,
  arbitros: revalidateArbitrosCache,
  documentos: revalidateDocumentosCache,
  ranking: revalidateRankingCache,
}

/**
 * POST /api/admin/cache/revalidate
 * Admin endpoint to purge the cache of the public pages.
 * Body (optional): { scope?: 'all' | keyof typeof INVALIDATORS }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = (await request.json().catch(() => ({}))) as { scope?: unknown }
    const scope = typeof body?.scope === 'string' && body.scope ? body.scope : 'all'

    if (scope !== 'all' && !(scope in INVALIDATORS)) {
      return validationError(`Ámbito de caché no válido: ${scope}`)
    }

    const scopes = scope === 'all' ? Object.keys(INVALIDATORS) : [scope]
    scopes.forEach((key) => INVALIDATORS[key]())

    return apiSuccess({
      success: true,
      scopes,
      message:
        scope === 'all'
          ? 'Caché purgada en todas las secciones'
          : `Caché purgada en la sección "${scope}"`,
    })
  } catch (error) {
    return handleError(error)
  }
}
