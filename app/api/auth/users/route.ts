import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify the requesting user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Fetch all users from Supabase Auth using admin API
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust as needed
    })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Also fetch admin and club admin data to enrich user information
    const { data: admins } = await supabaseAdmin
      .from('admins')
      .select('auth_id')
    
    const { data: clubAdmins } = await supabaseAdmin
      .from('club_admins')
      .select(`
        auth_id,
        club_id,
        club:clubs(id, name)
      `)
    
    // Create sets for quick lookup
    const adminIds = new Set((admins || []).map((a: any) => a.auth_id))
    const clubAdminData: Record<string, string[]> = {}
    
    ;(clubAdmins || []).forEach((ca: any) => {
      if (!clubAdminData[ca.auth_id]) {
        clubAdminData[ca.auth_id] = []
      }
      clubAdminData[ca.auth_id].push(ca.club?.name || 'Club desconocido')
    })
    
    // Transform the users data to match our interface
    const transformedUsers = users.map((authUser: any) => ({
      id: authUser.id,
      email: authUser.email || 'email@no-disponible.com',
      emailVerified: authUser.email_confirmed_at !== null,
      lastSignIn: authUser.last_sign_in_at,
      createdAt: authUser.created_at,
      nombre: authUser.user_metadata?.nombre || authUser.user_metadata?.name || 'Usuario',
      apellido: authUser.user_metadata?.apellido || authUser.user_metadata?.surname || '',
      telefono: authUser.user_metadata?.telefono || authUser.user_metadata?.phone || null,
      direccion: authUser.user_metadata?.direccion || authUser.user_metadata?.address || null,
      fecha_nacimiento: authUser.user_metadata?.fecha_nacimiento || authUser.user_metadata?.birth_date || null,
      isAdmin: adminIds.has(authUser.id),
      isClubAdmin: authUser.id in clubAdminData,
      adminClubs: clubAdminData[authUser.id] || []
    }))
    
    return Response.json(transformedUsers)
  } catch (error) {
    console.error('Error in users API:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 