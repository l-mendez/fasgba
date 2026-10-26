import { Suspense } from "react"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { UsersTable } from "@/components/users-table"
import { ErrorAlert } from "@/components/error-alert"

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
  isAlumno: boolean
  adminClubs: string[]
}

const USERS_PER_PAGE = 1000

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
      throw new Error('Falta configurar la clave de servicio de Supabase')
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(supabaseServiceUrl, supabaseServiceKey)

    // Fetch every page of users from Supabase Auth (max 1000 per page)
    const users: User[] = []
    for (let page = 1; ; page++) {
      const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: USERS_PER_PAGE,
      })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw new Error('Error al obtener los usuarios del sistema de autenticación')
      }

      users.push(...data.users)
      if (data.users.length < USERS_PER_PAGE) break
    }

    // Alumnos (service role: same access as /api/admin/alumnos)
    const { data: alumnos } = await supabaseAdmin
      .from('alumnos')
      .select('auth_id')
    const alumnoIds = new Set(alumnos?.map(alumno => alumno.auth_id) || [])

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
    const transformedUsers: UserWithPermissions[] = users.map((authUser) => ({
      id: authUser.id,
      email: authUser.email || 'email@no-disponible.com',
      emailVerified: Boolean(authUser.email_confirmed_at),
      lastSignIn: authUser.last_sign_in_at ?? null,
      createdAt: authUser.created_at,
      nombre: authUser.user_metadata?.nombre || authUser.user_metadata?.name || undefined,
      apellido: authUser.user_metadata?.apellido || authUser.user_metadata?.surname || undefined,
      telefono: authUser.user_metadata?.telefono || authUser.user_metadata?.phone || null,
      direccion: authUser.user_metadata?.direccion || authUser.user_metadata?.address || null,
      fecha_nacimiento: authUser.user_metadata?.fecha_nacimiento || authUser.user_metadata?.birth_date || null,
      isAdmin: adminIds.has(authUser.id),
      isClubAdmin: clubAdminMap.has(authUser.id),
      isAlumno: alumnoIds.has(authUser.id),
      adminClubs: clubAdminMap.get(authUser.id) || []
    }))

    return transformedUsers
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-6">
      <AdminPageHeader title="Usuarios" />
      <Suspense fallback={<AdminContentSkeleton rows={6} filters={false} />}>
        <UsersContent />
      </Suspense>
    </div>
  )
}

async function UsersContent() {
  let users: UserWithPermissions[] = []
  let error: string | null = null

  try {
    users = await fetchAllUsers()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los usuarios"
  }

  if (error) {
    return (
      <div>
        <ErrorAlert message={error} />
      </div>
    )
  }

  return <UsersTable initialUsers={users} />
}
