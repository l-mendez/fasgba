import { NextRequest } from 'next/server'
import { getRelatedNews, getNewsById } from '@/lib/newsUtils'
import { validateNewsId } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idParam } = await params
    const newsId = validateNewsId(idParam)
    
    // Check if the news item exists
    const news = await getNewsById(newsId, [])
    if (!news) {
      return notFoundError(ERROR_MESSAGES.NEWS_NOT_FOUND || 'News not found', `No news found with ID ${newsId}`)
    }
    
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam), 20) : 4
    
    const related = await getRelatedNews(newsId, limit)
    return apiSuccess({ related })
  } catch (error) {
    return handleError(error)
  }
} 