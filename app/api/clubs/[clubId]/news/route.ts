import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClubNews, getClubById } from '@/lib/clubUtils'
import { createNews } from '@/lib/newsUtils'
import { validateClubId, validateClubNewsQuery } from '@/lib/schemas/clubSchemas'
import { validateCreateNews } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const { searchParams } = new URL(request.url)
    const queryParams = validateClubNewsQuery(searchParams)
    
    const news = await getClubNews(clubId, queryParams.limit)
    return apiSuccess(news)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
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

    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    // Check if user is admin of this club
    const { data: adminCheck } = await supabase
      .from('club_admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
      .single()

    // Check if user is site admin (using the admins table)
    const { data: siteAdminCheck } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isClubAdmin = !!adminCheck
    const isSiteAdmin = !!siteAdminCheck

    if (!isClubAdmin && !isSiteAdmin) {
      return forbiddenError('You must be an admin of this club or a site admin to create news for this club')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateCreateNews(body)

    // Ensure the club_id matches the route parameter
    const newsData = {
      ...validatedData,
      image: validatedData.image ?? undefined,
      club_id: clubId,
      created_by_auth_id: user.id
    }

    const createdNews = await createNews(newsData)
    
    return apiSuccess(createdNews, 201)
  } catch (error) {
    return handleError(error)
  }
} 