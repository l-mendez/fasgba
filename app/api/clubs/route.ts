import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClub } from '@/lib/clubUtils'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/clubs - Get all clubs
export async function GET(request: NextRequest) {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clubs:', error)
      throw new Error('Failed to fetch clubs')
    }

    return apiSuccess({ clubs: clubs || [] })
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

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return unauthorizedError('Admin access required')
    }

    // Parse and validate request body
    const body = await request.json()
    
    const clubData = {
      name: body.name,
      address: body.address || null,
      telephone: body.telephone || null,
      mail: body.mail || null,
      schedule: body.schedule || null,
      image: body.image || null
    }

    const newClub = await createClub(clubData)
    
    return apiSuccess(newClub, 201)
  } catch (error) {
    return handleError(error)
  }
} 