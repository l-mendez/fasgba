import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNewsById, updateNews, deleteNews, canUserEditNews } from '@/lib/newsUtils'
import { validateNewsId, validateUpdateNews } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { requireAuth } from '@/lib/middleware/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idParam } = await params
    const newsId = validateNewsId(idParam)
    const { searchParams } = new URL(request.url)
    
    // Determine what to include
    const includeParam = searchParams.get('include')
    const include: Array<'author' | 'club'> = includeParam ? includeParam.split(',').map(i => i.trim()).filter((i): i is 'author' | 'club' => i === 'author' || i === 'club') : ['author', 'club']
    
    const news = await getNewsById(newsId, include)
    
    if (!news) {
      return notFoundError(ERROR_MESSAGES.NEWS_NOT_FOUND || 'News not found', `No news found with ID ${newsId}`)
    }
    
    return apiSuccess(news)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { id: idParam } = await params
    const newsId = validateNewsId(idParam)
    
    // Check if news exists
    const existingNews = await getNewsById(newsId, [])
    if (!existingNews) {
      return notFoundError(ERROR_MESSAGES.NEWS_NOT_FOUND || 'News not found', `No news found with ID ${newsId}`)
    }

    // Check if user can edit this news
    const canEdit = await canUserEditNews(newsId, user.id)
    if (!canEdit) {
      return forbiddenError('You do not have permission to edit this news item')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateUpdateNews(body)

    // Update the news item
    await updateNews(newsId, validatedData)
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { id: idParam } = await params
    const newsId = validateNewsId(idParam)
    
    // Check if news exists
    const existingNews = await getNewsById(newsId, [])
    if (!existingNews) {
      return notFoundError(ERROR_MESSAGES.NEWS_NOT_FOUND || 'News not found', `No news found with ID ${newsId}`)
    }

    // Check if user can delete this news
    const canEdit = await canUserEditNews(newsId, user.id)
    if (!canEdit) {
      return forbiddenError('You do not have permission to delete this news item')
    }

    // Delete the news item
    await deleteNews(newsId)
    
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
} 