import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserEditForm } from "@/components/user-edit-form"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

interface Club {
  id: number
  name: string
}

interface UserWithPermissions {
  id: string
  email: string
  emailVerified: boolean
  lastSignIn: string | null
  createdAt: string
  nombre?: string
  apellido?: string
  isAdmin: boolean
  isClubAdmin: boolean
  adminClubs: string[]
}

interface ClubAdmin {
  club_id: number
  auth_id: string
  club: {
    id: number
    name: string
  }
}

// Server-side function to fetch user data
async function fetchUserData(userId: string): Promise<{
  user: UserWithPermissions | null
  clubs: Club[]
  clubsAdmin: ClubAdmin[]
}> {
  try {
    const supabase = await createClient()
    
    // Check if the current user is an admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      throw new Error('No tienes acceso a esta información')
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', currentUser.id)
      .single()

    if (adminError || !adminData) {
      throw new Error('No tienes permisos de administrador para ver esta información')
    }

    // Use the service role client to fetch user information
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      throw new Error('Service role key not configured')
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(supabaseServiceUrl, supabaseServiceKey)

    // Fetch all users and find the specific one
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw new Error('Error al obtener los usuarios del sistema de autenticación')
    }

    const userData = users.find((u: any) => u.id === userId)
    
    if (!userData) {
      return { user: null, clubs: [], clubsAdmin: [] }
    }

    // Get all admins
    const { data: admins } = await supabase
      .from('admins')
      .select('auth_id')

    // Get all club admins with club names
    const { data: clubAdmins } = await supabase
      .from('club_admins')
      .select(`
        auth_id,
        clubs!inner(name)
      `)

    const adminIds = new Set(admins?.map(admin => admin.auth_id) || [])
    
    // Group club admins by auth_id
    const clubAdminMap = new Map<string, string[]>()
    clubAdmins?.forEach((clubAdmin: any) => {
      const authId = clubAdmin.auth_id
      const clubName = clubAdmin.clubs?.name || 'Club desconocido'
      
      if (!clubAdminMap.has(authId)) {
        clubAdminMap.set(authId, [])
      }
      clubAdminMap.get(authId)?.push(clubName)
    })

    // Transform user data
    const transformedUser: UserWithPermissions = {
      id: userData.id,
      email: userData.email || 'email@no-disponible.com',
      emailVerified: userData.email_confirmed_at !== null,
      lastSignIn: userData.last_sign_in_at || null,
      createdAt: userData.created_at,
      nombre: userData.user_metadata?.nombre || userData.user_metadata?.name || undefined,
      apellido: userData.user_metadata?.apellido || userData.user_metadata?.surname || undefined,
      isAdmin: adminIds.has(userData.id),
      isClubAdmin: clubAdminMap.has(userData.id),
      adminClubs: clubAdminMap.get(userData.id) || []
    }

    // Fetch all clubs
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name')
    
    if (clubsError) throw clubsError
    const clubs = clubsData || []

    // Fetch club admin relationships for this specific user
    const { data: clubAdminsData, error: clubAdminsError } = await supabase
      .from('club_admins')
      .select(`
        club_id, 
        auth_id, 
        club:clubs(id, name)
      `)
      .eq('auth_id', userId)
    
    if (clubAdminsError) throw clubAdminsError
    
    const transformedClubAdmins: ClubAdmin[] = (clubAdminsData || []).map((item: any) => ({
      club_id: item.club_id,
      auth_id: item.auth_id,
      club: {
        id: item.club?.id || 0,
        name: item.club?.name || ''
      }
    }))

    return {
      user: transformedUser,
      clubs,
      clubsAdmin: transformedClubAdmins
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

export default async function EditarUsuarioPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: userId } = await params
  let user: UserWithPermissions | null = null
  let clubs: Club[] = []
  let clubsAdmin: ClubAdmin[] = []
  let error: string | null = null

  try {
    const data = await fetchUserData(userId)
    user = data.user
    clubs = data.clubs
    clubsAdmin = data.clubsAdmin
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los datos del usuario"
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert>
          <span className="text-red-600 mr-2">⚠️</span>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) {
    notFound()
  }

  return <UserEditForm user={user} clubs={clubs} clubsAdmin={clubsAdmin} />
} 