import { NextRequest, after } from 'next/server'
import { sendBroadcast } from '@/lib/notifications/sendBroadcast'
import { createClient } from '@supabase/supabase-js'
import { createNews } from '@/lib/newsUtils'
import { fetchAdminNewsPage } from '@/lib/adminNews'
import { revalidateNewsCache } from '@/lib/cache/news'
import { validateCreateNews } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/news - paginated admin news listing with search/filters
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.substring(7))
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { data: admin } = await supabase.from('admins').select('auth_id').eq('auth_id', user.id).single()
    if (!admin) {
      return forbiddenError('Solo los administradores pueden ver esta información')
    }

    const { searchParams } = new URL(request.url)
    const result = await fetchAdminNewsPage({
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      search: searchParams.get('search') || '',
      club: searchParams.get('club') || 'all',
      date: searchParams.get('date') || '',
      sortBy: searchParams.get('sortBy') === 'title' ? 'title' : 'date',
      order: searchParams.get('order') === 'asc' ? 'asc' : 'desc',
    })

    return apiSuccess(result)
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
    revalidateNewsCache(createdNews.id)

    // Run broadcast after the response is sent so the 201 isn't blocked
    // by SMTP latency. `after()` is reliable in serverless (unlike bare
    // fire-and-forget which can be killed when the response returns).
    after(async () => {
      try {
        await sendBroadcast({ type: 'news_created', newsId: createdNews.id })
      } catch (err) {
        console.error('[news] sendBroadcast failed', err)
      }
    })

    return apiSuccess(createdNews, 201)
  } catch (error) {
    return handleError(error)
  }
} 