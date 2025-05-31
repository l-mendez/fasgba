import { NextRequest } from 'next/server'
import { getNewsCount } from '@/lib/newsUtils'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: any = {}
    
    const clubIdParam = searchParams.get('clubId')
    if (clubIdParam) {
      const clubId = parseInt(clubIdParam, 10)
      if (!isNaN(clubId) && clubId > 0) {
        filters.clubId = clubId
      }
    }
    
    const authorIdParam = searchParams.get('authorId')
    if (authorIdParam) {
      const authorId = parseInt(authorIdParam, 10)
      if (!isNaN(authorId) && authorId > 0) {
        filters.authorId = authorId
      }
    }
    
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      try {
        const tags = JSON.parse(tagsParam)
        if (Array.isArray(tags)) {
          filters.tags = tags
        }
      } catch {
        // If not JSON, treat as comma-separated values
        filters.tags = tagsParam.split(',').map(tag => tag.trim()).filter(Boolean)
      }
    }
    
    const count = await getNewsCount(filters)
    return apiSuccess({ count })
  } catch (error) {
    return handleError(error)
  }
} 