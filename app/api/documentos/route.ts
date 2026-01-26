import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { documentoQuerySchema, SORT_OPTIONS, type SortOption } from '@/lib/schemas/documentosSchemas'
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
      sort: searchParams.get('sort') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryResult.success) {
      return apiSuccess({ documentos: [], total: 0 })
    }

    const { category, sort, page, limit } = queryResult.data
    const offset = (page - 1) * limit

    // Get sort configuration
    const sortConfig = SORT_OPTIONS[sort as SortOption] || SORT_OPTIONS['custom']

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('documentos')
      .select('id, name, category, file_path, file_size, file_type, sort_order, importance_level, created_at', { count: 'exact' })
      .order(sortConfig.column, { ascending: sortConfig.ascending })

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
      sort,
    })
  } catch (error) {
    return handleError(error)
  }
}
