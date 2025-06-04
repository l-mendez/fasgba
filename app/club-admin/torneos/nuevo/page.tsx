import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClubProvider } from "../../context/club-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NuevoTorneoForm } from "./nuevo-torneo-form"

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

// Server component to get user's clubs
async function getUserClubs(): Promise<{ clubs: Club[], selectedClub: Club | null }> {
  try {
    // Use the proper server client that handles authentication correctly
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { clubs: [], selectedClub: null }
    }

    // Get clubs where user is admin using the admin client for the query
    const adminClient = createAdminClient()
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
      return { clubs: [], selectedClub: null }
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

    const selectedClub = clubs.length > 0 ? clubs[0] : null

    return { clubs, selectedClub }
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return { clubs: [], selectedClub: null }
  }
}

// Main server component
export default async function NuevoTorneoPage() {
  const { clubs, selectedClub } = await getUserClubs()
  
  // If no clubs, return not found
  if (clubs.length === 0) {
    notFound()
  }
    
  return (
    <ClubProvider initialClubs={clubs} initialSelectedClub={selectedClub}>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/club-admin/torneos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Torneo</h1>
            <p className="text-muted-foreground">Crea un nuevo torneo para {selectedClub?.name || 'tu club'}.</p>
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <NuevoTorneoForm selectedClub={selectedClub} />
        </Suspense>
      </div>
    </ClubProvider>
  )
}

