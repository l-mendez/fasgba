import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

// Database Club interface (matches actual schema)
interface DbClub {
  id: number
  name: string
  address?: string
  telephone?: string
  mail?: string
  schedule?: string
}

// Expected Club interface (matches ClubProvider context)
interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Function to map database club to expected club format
function mapDbClubToClub(dbClub: DbClub): Club {
  return {
    id: dbClub.id,
    name: dbClub.name,
    description: undefined,
    location: dbClub.address,
    website: undefined,
    email: dbClub.mail,
    phone: dbClub.telephone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Check authentication early
async function checkAuthentication(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    return !userError && !!user
  } catch {
    return false
  }
}

// Server function to get user permissions and clubs
async function getUserData(): Promise<{
  isSiteAdmin: boolean
  isClubAdmin: boolean
  clubs: Club[]
  selectedClub: Club | null
  error: string | null
}> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        isSiteAdmin: false,
        isClubAdmin: false,
        clubs: [],
        selectedClub: null,
        error: 'Usuario no autenticado'
      }
    }

    const adminClient = createAdminClient()

    // Check if user is site admin
    const { data: siteAdminData, error: siteAdminError } = await adminClient
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isSiteAdmin = !siteAdminError && !!siteAdminData

    // Get user's admin clubs
    const { data: adminData, error: adminError } = await adminClient
      .from('club_admins')
      .select(`
        club_id,
        clubs (
          id,
          name,
          address,
          telephone,
          mail,
          schedule
        )
      `)
      .eq('auth_id', user.id)

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return {
        isSiteAdmin,
        isClubAdmin: false,
        clubs: [],
        selectedClub: null,
        error: 'Error verificando permisos de club'
      }
    }

    // Properly type and filter the clubs data
    const dbClubs: DbClub[] = (adminData || [])
      .filter(item => item.clubs)
      .map(item => {
        const club = item.clubs as any
        return {
          id: club.id,
          name: club.name,
          address: club.address,
          telephone: club.telephone,
          mail: club.mail,
          schedule: club.schedule
        }
      })

    // Convert to expected Club format
    const clubs: Club[] = dbClubs.map(mapDbClubToClub)
    const isClubAdmin = clubs.length > 0
    const selectedClub = clubs.length > 0 ? clubs[0] : null

    return {
      isSiteAdmin,
      isClubAdmin,
      clubs,
      selectedClub,
      error: null
    }

  } catch (error) {
    console.error('Error in getUserData:', error)
    return {
      isSiteAdmin: false,
      isClubAdmin: false,
      clubs: [],
      selectedClub: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Metadata generation
export async function generateMetadata() {
  return {
    title: 'Nuevo Torneo | FASGBA',
    description: 'Crear un nuevo torneo de ajedrez',
  }
}

// Main server component
export default async function NuevoTorneoPage() {
  // Check authentication first - if not authenticated, redirect to login
  const isAuthenticated = await checkAuthentication()
  
  if (!isAuthenticated) {
    redirect('/login')
  }
  
  // Get user data and permissions
  const { isSiteAdmin, isClubAdmin, clubs, selectedClub, error } = await getUserData()

  // If user has no permissions at all, return not found
  if (!isSiteAdmin && !isClubAdmin) {
    notFound()
  }

  // Dynamic import the form component only when we need it
  const NuevoTorneoForm = (await import("./nuevo-torneo-form")).NuevoTorneoForm

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Torneo</h1>
          <p className="text-muted-foreground">
            {isSiteAdmin 
              ? 'Crea un nuevo torneo' 
              : `Crea un nuevo torneo para ${selectedClub?.name || 'tu club'}`
            }
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <NuevoTorneoForm 
          isSiteAdmin={isSiteAdmin}
          clubs={clubs}
          selectedClub={selectedClub}
        />
      </Suspense>
    </div>
  )
} 