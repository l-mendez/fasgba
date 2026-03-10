import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'
import { z } from 'zod'

// Validation schema for player data
const playerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  fide_id: z.string().max(20, 'FIDE ID too long').optional().or(z.literal('')),
  rating: z.number().int().min(0, 'Rating must be positive').max(4000, 'Rating too high').optional(),
  club_id: z.number().int().positive('Invalid club ID').optional(),
})

// GET /api/players - Get players with pagination and search
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10))) // Max 100
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Build query with pagination
    let query = serverSupabase
      .from('players')
      .select(`
        id,
        full_name,
        fide_id,
        rating,
        club:clubs!players_club_id_fkey (
          id,
          name
        )
      `, { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    const { data: players, error: playersError, count } = await query
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (playersError) {
      console.error('Error fetching players:', playersError)
      throw new Error('Failed to fetch players')
    }

    return apiSuccess({
      players: players || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    // Clean up empty strings to null for optional fields
    const cleanedBody = {
      ...body,
      fide_id: body.fide_id === '' ? null : body.fide_id,
      rating: body.rating === '' || body.rating === undefined ? null : Number(body.rating),
      club_id: body.club_id === '' || body.club_id === undefined ? null : Number(body.club_id),
    }
    
    const validatedData = playerSchema.parse(cleanedBody)

    // Create the player
    const { data: player, error: playerError } = await serverSupabase
      .from('players')
      .insert([validatedData])
      .select(`
        id,
        full_name,
        fide_id,
        rating,
        club:clubs!players_club_id_fkey (
          id,
          name
        )
      `)
      .single()

    if (playerError) {
      console.error('Error creating player:', playerError)
      
      // Handle unique constraint violations
      if (playerError.code === '23505' && playerError.message.includes('fide_id')) {
        return validationError('A player with this FIDE ID already exists')
      }
      
      throw new Error('Failed to create player')
    }

    return apiSuccess(player, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
} 