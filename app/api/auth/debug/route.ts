import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')

    const response: Record<string, unknown> = {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
      timestamp: new Date().toISOString()
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      // Verify the JWT token with Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)

      response.tokenValid = !authError && !!user
      response.userId = user?.id || null
      response.userEmail = user?.email || null
      response.authError = authError?.message || null

      if (user) {
        // Check if user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('auth_id')
          .eq('auth_id', user.id)
          .single()

        response.isAdmin = !adminError && !!adminData
        response.adminError = adminError?.message || null

        // Check followed clubs count
        const { count: followedCount, error: followError } = await supabase
          .from('user_follows_club')
          .select('*', { count: 'exact', head: true })
          .eq('auth_id', user.id)

        response.followedClubsCount = followedCount || 0
        response.followError = followError?.message || null

        // Check club admin count
        const { count: adminClubsCount, error: adminClubsError } = await supabase
          .from('club_admins')
          .select('*', { count: 'exact', head: true })
          .eq('auth_id', user.id)

        response.adminClubsCount = adminClubsCount || 0
        response.adminClubsError = adminClubsError?.message || null
      }
    }

    return Response.json(response)
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 