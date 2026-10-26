import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ status: z.enum(['pending', 'ignored']) })

interface RouteParams {
  params: Promise<{ tnr: string }>
}

/**
 * PATCH /api/admin/chess-results/candidates/:tnr  { status: 'pending' | 'ignored' }
 * Ignores a discovered tournament or restores it to the review queue.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)
    const tnr = Number((await params).tnr)
    const body = bodySchema.safeParse(await request.json().catch(() => null))
    if (!Number.isInteger(tnr) || tnr <= 0 || !body.success) return validationError('Pedido inválido.')

    const { data, error } = await createAdminClient().from('chess_results_candidates')
      .update({ status: body.data.status, updated_at: new Date().toISOString() })
      .eq('tnr', tnr).select('tnr, status').maybeSingle()
    if (error) throw new Error(`Error al actualizar el candidato: ${error.message}`)
    if (!data) return notFoundError('Torneo de chess-results no encontrado.')
    return apiSuccess(data)
  } catch (error) {
    return handleError(error)
  }
}
