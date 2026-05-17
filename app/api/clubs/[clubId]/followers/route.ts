import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, noContent, handleError, validationError, notFoundError, conflictError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

// Helper function to create user-context Supabase client
function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return validationError('Invalid club ID')
    }
    
    // Extract JWT token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return validationError('Missing authentication token')
    }
    
    // Create user-context Supabase client
    const supabase = createUserClient(token)
    
    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubId)
      .single()
    
    if (clubError || !club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND)
    }
    
    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows_club')
      .select('auth_id')
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
      .single()
    
    if (existingFollow) {
      return conflictError('Already following this club')
    }
    
    // Create follow relationship
    const { error: followError } = await supabase
      .from('user_follows_club')
      .insert({
        auth_id: user.id,
        club_id: clubId
      })
    
    if (followError) {
      throw followError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return validationError('Invalid club ID')
    }
    
    // Extract JWT token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return validationError('Missing authentication token')
    }
    
    // Create user-context Supabase client
    const supabase = createUserClient(token)
    
    // Remove follow relationship
    const { error } = await supabase
      .from('user_follows_club')
      .delete()
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
    
    if (error) {
      throw error
    }
    
    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 