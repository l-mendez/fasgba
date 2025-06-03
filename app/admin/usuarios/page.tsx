import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users-table"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

// Updated interface to include additional user metadata
interface UserWithPermissions {
  id: string
  email: string
  emailVerified: boolean
  lastSignIn: string | null
  createdAt: string
  nombre?: string
  apellido?: string
  telefono?: string | null
  direccion?: string | null
  fecha_nacimiento?: string | null
  isAdmin: boolean
  isClubAdmin: boolean
  adminClubs: string[]
}

// Server-side function to fetch all users from Supabase Auth
async function fetchAllUsers(): Promise<UserWithPermissions[]> {
  try {
    const supabase = await createClient()
    
    // Check if the current user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('No tienes acceso a esta información')
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !adminData) {
      throw new Error('No tienes permisos de administrador para ver esta información')
    }

    // Use the service role client to fetch all users from Supabase Auth
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      throw new Error('Service role key not configured')
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(supabaseServiceUrl, supabaseServiceKey)

    // Fetch all users from Supabase Auth using admin API
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust as needed
    })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw new Error('Error al obtener los usuarios del sistema de autenticación')
    }

    // Get all admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('auth_id')

    // Get all club admins with club names
    const { data: clubAdmins, error: clubAdminsError } = await supabase
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

    // Transform the users data to match UserWithPermissions interface
    const transformedUsers: UserWithPermissions[] = users.map((authUser: any) => ({
      id: authUser.id,
      email: authUser.email || 'email@no-disponible.com',
      emailVerified: authUser.email_confirmed_at !== null,
      lastSignIn: authUser.last_sign_in_at,
      createdAt: authUser.created_at,
      nombre: authUser.user_metadata?.nombre || authUser.user_metadata?.name || undefined,
      apellido: authUser.user_metadata?.apellido || authUser.user_metadata?.surname || undefined,
      telefono: authUser.user_metadata?.telefono || authUser.user_metadata?.phone || null,
      direccion: authUser.user_metadata?.direccion || authUser.user_metadata?.address || null,
      fecha_nacimiento: authUser.user_metadata?.fecha_nacimiento || authUser.user_metadata?.birth_date || null,
      isAdmin: adminIds.has(authUser.id),
      isClubAdmin: clubAdminMap.has(authUser.id),
      adminClubs: clubAdminMap.get(authUser.id) || []
    }))

    return transformedUsers
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export default async function UsersPage() {
  let users: UserWithPermissions[] = []
  let error: string | null = null

  try {
    users = await fetchAllUsers()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los usuarios"
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Usuarios</h2>
        <div className="flex items-center space-x-2">
        </div>
      </div>
      
      <UsersTable initialUsers={users} />
    </div>
  )
}

