import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check if user is site admin
    const { data: siteAdminCheck, error: siteAdminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    // Get all clubs where user is admin
    const { data: clubAdminData, error: clubAdminError } = await supabase
      .from('club_admins')
      .select(`
        club_id,
        clubs (
          id,
          name
        )
      `)
      .eq('auth_id', user.id)

    // Get all clubs for reference
    const { data: allClubs, error: allClubsError } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name')

    return Response.json({
      user: {
        id: user.id,
        email: user.email
      },
      isSiteAdmin: !!siteAdminCheck,
      siteAdminError: siteAdminError?.message || null,
      clubAdminData: clubAdminData || [],
      clubAdminError: clubAdminError?.message || null,
      allClubs: allClubs || [],
      allClubsError: allClubsError?.message || null,
      permissions: {
        canCreateNewsForAnyClub: !!siteAdminCheck,
        canCreateNewsForClubs: (clubAdminData || []).map((item: any) => ({
          clubId: item.club_id,
          clubName: item.clubs?.name || 'Unknown'
        }))
      }
    })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 