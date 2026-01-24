import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { documentoQuerySchema } from '@/lib/schemas/documentosSchemas'
import { isValidCategory } from '@/lib/documentosUtils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/documentos
 * Public endpoint to list all documents with optional category filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params
    const queryResult = documentoQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryResult.success) {
      return apiSuccess({ documentos: [], total: 0 })
    }

    const { category, page, limit } = queryResult.data
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('documentos')
      .select('id, name, category, file_path, file_size, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply category filter if provided
    if (category && isValidCategory(category)) {
      query = query.eq('category', category)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching documentos:', error)
      return apiSuccess({ documentos: [], total: 0 })
    }

    return apiSuccess({
      documentos: data || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    return handleError(error)
  }
}
