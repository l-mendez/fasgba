import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const user = await requireAuth(request)
    const supabase = await createClient()
    
    // Check if user follows this club
    const { data, error } = await supabase
      .from('club_followers')
      .select('*')
      .eq('club_id', resolvedParams.clubId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return apiSuccess({ isFollowing: !!data })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const user = await requireAuth(request)
    const supabase = await createClient()
    
    // Add user as follower
    const { error } = await supabase
      .from('club_followers')
      .insert({
        club_id: resolvedParams.clubId,
        user_id: user.id
      })

    if (error) throw error

    return apiSuccess({ message: 'Successfully followed club' })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const user = await requireAuth(request)
    const supabase = await createClient()
    
    // Remove user as follower
    const { error } = await supabase
      .from('club_followers')
      .delete()
      .eq('club_id', resolvedParams.clubId)
      .eq('user_id', user.id)

    if (error) throw error

    return apiSuccess({ message: 'Successfully unfollowed club' })
  } catch (error) {
    return handleError(error)
  }
} 