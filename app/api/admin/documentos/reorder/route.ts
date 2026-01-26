import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiSuccess,
  handleError,
  validationError,
} from '@/lib/utils/apiResponse'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema for reordering documents
const reorderSchema = z.object({
  documentIds: z.array(z.number().positive()).min(1, 'Se requiere al menos un documento'),
})

/**
 * POST /api/admin/documentos/reorder
 * Admin endpoint to reorder documents by updating their sort_order
 * Expects an array of document IDs in the desired order
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const result = reorderSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.errors[0]?.message || 'Datos inválidos')
    }

    const { documentIds } = result.data
    const adminSupabase = createAdminClient()

    // Update sort_order for each document based on its position in the array
    const updates = documentIds.map((id, index) =>
      adminSupabase
        .from('documentos')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error('Reorder errors:', errors.map((e) => e.error))
      return validationError('Error al reordenar algunos documentos')
    }

    return apiSuccess({
      success: true,
      message: 'Documentos reordenados exitosamente',
    })
  } catch (error) {
    return handleError(error)
  }
}
