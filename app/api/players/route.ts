import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'
import { z } from 'zod'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Validation schema for player data
const playerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  fide_id: z.string().max(20, 'FIDE ID too long').nullish().or(z.literal('')),
  rating: z.number().int().min(0, 'Rating must be positive').max(4000, 'Rating too high').nullish(),
  club_id: z.number().int().positive('Invalid club ID').nullish(),
})

// GET /api/players - Get players with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Return aggregate stats if requested
    if (searchParams.get('stats') === 'true') {
      const [totalResult, fideResult, clubResult] = await Promise.all([
        serverSupabase.from('players').select('*', { count: 'exact', head: true }),
        serverSupabase.from('players').select('*', { count: 'exact', head: true }).not('fide_id', 'is', null),
        serverSupabase.from('players').select('*', { count: 'exact', head: true }).not('club_id', 'is', null),
      ])
      return apiSuccess({
        total: totalResult.count || 0,
        withFideId: fideResult.count || 0,
        withClub: clubResult.count || 0,
      })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10))) // Max 100
    const search = searchParams.get('search') || ''
    const clubId = searchParams.get('club_id') || ''
    const offset = (page - 1) * limit

    // If searching, find matching club IDs for club name search
    let matchingClubIds: number[] = []
    if (search) {
      const { data: clubs } = await serverSupabase
        .from('clubs')
        .select('id')
        .ilike('name', `%${search}%`)
      matchingClubIds = (clubs || []).map(c => c.id)
    }

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

    // Apply search filter (name, FIDE ID, or club name)
    if (search) {
      const orFilters = [`full_name.ilike.%${search}%`, `fide_id.ilike.%${search}%`]
      if (matchingClubIds.length > 0) {
        orFilters.push(`club_id.in.(${matchingClubIds.join(',')})`)
      }
      query = query.or(orFilters.join(','))
    }

    // Apply club filter
    if (clubId) {
      query = query.eq('club_id', parseInt(clubId, 10))
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