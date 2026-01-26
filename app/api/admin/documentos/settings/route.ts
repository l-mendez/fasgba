import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiSuccess,
  handleError,
  validationError,
} from '@/lib/utils/apiResponse'
import { z } from 'zod'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/documentosUtils'

export const dynamic = 'force-dynamic'

// Valid category values
const categoryValues = Object.keys(DOCUMENT_CATEGORIES) as [string, ...string[]]

// Schema for importance settings
const importanceSchema = z.object({
  categoryImportance: z.record(
    z.enum(categoryValues),
    z.number().min(0).max(100)
  ),
})

/**
 * GET /api/admin/documentos/settings
 * Get document sorting settings (category importance levels)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const adminSupabase = createAdminClient()

    // Get distinct categories and their max importance level
    const { data, error } = await adminSupabase
      .from('documentos')
      .select('category, importance_level')

    if (error) {
      console.error('Error fetching settings:', error)
      return apiSuccess({
        categoryImportance: {
          reglamentos: 0,
          actas: 0,
          minutas: 0,
          otros: 0,
        },
      })
    }

    // Group by category and get max importance level for each
    const categoryImportance: Record<string, number> = {
      reglamentos: 0,
      actas: 0,
      minutas: 0,
      otros: 0,
    }

    if (data) {
      for (const doc of data) {
        const currentMax = categoryImportance[doc.category] || 0
        if (doc.importance_level > currentMax) {
          categoryImportance[doc.category] = doc.importance_level
        }
      }
    }

    return apiSuccess({ categoryImportance })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/documentos/settings
 * Update document sorting settings (category importance levels)
 * This updates all documents in each category with the specified importance level
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const result = importanceSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.errors[0]?.message || 'Datos inválidos')
    }

    const { categoryImportance } = result.data
    const adminSupabase = createAdminClient()

    // Update importance_level for all documents in each category
    const updates = Object.entries(categoryImportance).map(([category, importance]) =>
      adminSupabase
        .from('documentos')
        .update({ importance_level: importance })
        .eq('category', category)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error('Settings update errors:', errors.map((e) => e.error))
      return validationError('Error al actualizar la configuración')
    }

    return apiSuccess({
      success: true,
      message: 'Configuración actualizada exitosamente',
    })
  } catch (error) {
    return handleError(error)
  }
}
