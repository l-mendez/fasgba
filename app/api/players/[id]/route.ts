import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { z } from 'zod'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Validation schema for player updates
const updatePlayerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Name too long').optional(),
  fide_id: z.string().max(20, 'FIDE ID too long').nullish().or(z.literal('')),
  rating: z.number().int().min(0, 'Rating must be positive').max(4000, 'Rating too high').nullish(),
  club_id: z.number().int().positive('Invalid club ID').nullish(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/players/[id] - Get a specific player
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const playerId = parseInt(id, 10)
    
    if (isNaN(playerId) || playerId <= 0) {
      return validationError('Invalid player ID')
    }

    const { data: player, error: playerError } = await serverSupabase
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
      `)
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return notFoundError('Player not found')
    }

    return apiSuccess(player)
  } catch (error) {
    return handleError(error)
  }
}

// PATCH /api/players/[id] - Update a player
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const playerId = parseInt(id, 10)
    
    if (isNaN(playerId) || playerId <= 0) {
      return validationError('Invalid player ID')
    }

    const body = await request.json()
    
    // Clean up empty strings to null for optional fields
    const cleanedBody = {
      ...body,
      fide_id: body.fide_id === '' ? null : body.fide_id,
      rating: body.rating === '' || body.rating === undefined ? null : Number(body.rating),
      club_id: body.club_id === '' || body.club_id === undefined ? null : Number(body.club_id),
    }
    
    const validatedData = updatePlayerSchema.parse(cleanedBody)

    // Update the player
    const { data: player, error: playerError } = await serverSupabase
      .from('players')
      .update(validatedData)
      .eq('id', playerId)
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
      console.error('Error updating player:', playerError)
      
      // Handle unique constraint violations
      if (playerError.code === '23505' && playerError.message.includes('fide_id')) {
        return validationError('A player with this FIDE ID already exists')
      }
      
      // Handle not found
      if (playerError.code === 'PGRST116') {
        return notFoundError('Player not found')
      }
      
      throw new Error('Failed to update player')
    }

    return apiSuccess(player)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
}

// DELETE /api/players/[id] - Delete a player
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const playerId = parseInt(id, 10)
    
    if (isNaN(playerId) || playerId <= 0) {
      return validationError('Invalid player ID')
    }

    // Check if player exists
    const { data: player, error: fetchError } = await serverSupabase
      .from('players')
      .select('id, full_name')
      .eq('id', playerId)
      .single()

    if (fetchError || !player) {
      return notFoundError('Player not found')
    }

    // Delete the player
    const { error: deleteError } = await serverSupabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (deleteError) {
      console.error('Error deleting player:', deleteError)
      
      // Handle foreign key constraints
      if (deleteError.code === '23503') {
        return validationError('Cannot delete player because they are referenced in tournaments or games')
      }
      
      throw new Error('Failed to delete player')
    }

    return apiSuccess({ 
      message: 'Player deleted successfully',
      deletedPlayer: {
        id: player.id,
        full_name: player.full_name
      }
    })
  } catch (error) {
    return handleError(error)
  }
} 