import { NextRequest } from 'next/server'
import { getRelatedNews, getNewsById } from '@/lib/newsUtils'
import { validateNewsId } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const newsId = validateNewsId(params.id)
    const { searchParams } = new URL(request.url)
    
    // Parse limit parameter
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 4
    
    if (isNaN(limit) || limit <= 0 || limit > 20) {
      throw new Error('Limit must be between 1 and 20')
    }
    
    // Check if the news item exists
    const newsExists = await getNewsById(newsId, [])
    if (!newsExists) {
      return notFoundError(ERROR_MESSAGES.NEWS_NOT_FOUND || 'News not found', `No news found with ID ${newsId}`)
    }
    
    const relatedNews = await getRelatedNews(newsId, limit)
    return apiSuccess({ related: relatedNews })
  } catch (error) {
    return handleError(error)
  }
} 