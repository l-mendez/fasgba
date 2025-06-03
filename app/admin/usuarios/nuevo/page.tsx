import { createClient } from "@/lib/supabase/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserCreateForm } from "@/components/user-create-form"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

interface Club {
  id: number
  name: string
}

// Server-side function to fetch clubs data
async function fetchClubs(): Promise<Club[]> {
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

    // Fetch all clubs
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name', { ascending: true })

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError)
      throw new Error('Error al obtener los clubes')
    }

    return clubsData || []
  } catch (error) {
    console.error('Error fetching clubs:', error)
    throw error
  }
}

export default async function NewUserPage() {
  let clubs: Club[] = []
  let error: string | null = null

  try {
    clubs = await fetchClubs()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los clubes"
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

  return <UserCreateForm clubs={clubs} />
} 