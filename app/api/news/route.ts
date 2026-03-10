import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllNews, createNews } from '@/lib/newsUtils'
import { validateCreateNews, validateNewsQuery } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = validateNewsQuery(searchParams)
    
    const result = await getAllNews(queryParams)
    
    return apiSuccess({
      news: result.data,
      pagination: {
        page: queryParams.page || 1,
        limit: queryParams.limit || 10,
        total: result.total,
        totalPages: Math.ceil(result.total / (queryParams.limit || 10))
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateCreateNews(body)

    // If creating FASGBA news (no club_id), check if user is site admin
    if (!validatedData.club_id) {
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('auth_id')
        .eq('auth_id', user.id)
        .single()

      if (adminError || !admin) {
        return forbiddenError('Only site admins can create FASGBA news')
      }
    }

    // Create the news item with auth_id directly
    const newsData = {
      ...validatedData,
      image: validatedData.image || undefined, // Convert null to undefined for type compatibility
      club_id: validatedData.club_id || undefined, // Convert null to undefined for type compatibility
      created_by_auth_id: user.id
    }

    const createdNews = await createNews(newsData)
    
    // Trigger broadcast email for all news (FASGBA and club)
    try {
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'news_created',
          newsId: createdNews.id,
          broadcast: true,
        })
      })
      if (!notifyRes.ok) {
        console.error('Failed to trigger broadcast email:', await notifyRes.text())
      }
    } catch (e) {
      console.error('Broadcast email trigger error:', e)
    }

    return apiSuccess(createdNews, 201)
  } catch (error) {
    return handleError(error)
  }
} 