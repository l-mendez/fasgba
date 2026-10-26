import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { OrganizerClub } from "./nuevo-torneo-form"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nuevo torneo',
}

interface PageProps {
  searchParams: Promise<{ source?: string; clubId?: string }>
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
  clubs: OrganizerClub[]
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

    let clubs: OrganizerClub[] = []
    let isClubAdmin = false

    if (isSiteAdmin) {
      // Site admins can see ALL clubs to create tournaments for any club
      const { data: allClubsData, error: allClubsError } = await adminClient
        .from('clubs')
        .select('id, name, address')
        .order('name')

      if (allClubsError) {
        console.error('Error fetching all clubs:', allClubsError)
        return {
          isSiteAdmin,
          isClubAdmin: false,
          clubs: [],
          error: 'Error cargando clubs'
        }
      }

      clubs = allClubsData || []
      isClubAdmin = true // Site admins have club admin privileges
    } else {
      // Get user's admin clubs (for club admins)
      const { data: adminData, error: adminError } = await adminClient
        .from('club_admins')
        .select(`
          club_id,
          clubs (
            id,
            name,
            address
          )
        `)
        .eq('auth_id', user.id)
        .order('club_id')

      if (adminError) {
        console.error('Error fetching user clubs:', adminError)
        return {
          isSiteAdmin,
          isClubAdmin: false,
          clubs: [],
          error: 'Error verificando permisos de club'
        }
      }

      clubs = (adminData || [])
        .map((item) => (Array.isArray(item.clubs) ? item.clubs[0] : item.clubs) as OrganizerClub | null)
        .filter((club): club is OrganizerClub => Boolean(club))
      isClubAdmin = clubs.length > 0
    }

    return {
      isSiteAdmin,
      isClubAdmin,
      clubs,
      error: null
    }

  } catch (error) {
    console.error('Error in getUserData:', error)
    return {
      isSiteAdmin: false,
      isClubAdmin: false,
      clubs: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Main server component
export default async function NuevoTorneoPage({ searchParams }: PageProps) {
  // Check authentication first - if not authenticated, redirect to login
  const isAuthenticated = await checkAuthentication()

  if (!isAuthenticated) {
    redirect('/login')
  }

  const { source, clubId } = await searchParams

  // Get user data and permissions
  const { isSiteAdmin, isClubAdmin, clubs } = await getUserData()

  // If user has no permissions at all, return not found
  if (!isSiteAdmin && !isClubAdmin) {
    notFound()
  }

  // Coming from club-admin wins over the site-admin role (users can be both).
  const fromClubAdmin = source === 'club-admin' || !isSiteAdmin
  const returnPath = fromClubAdmin ? '/club-admin/torneos' : '/admin/torneos'
  const requestedClub = clubs.find((club) => club.id === Number(clubId))
  // Site admins default to FASGBA (no club); club admins to their first club.
  const defaultClubId = requestedClub?.id ?? (isSiteAdmin ? null : clubs[0]?.id ?? null)

  // Dynamic import the form component only when we need it
  const NuevoTorneoForm = (await import("./nuevo-torneo-form")).NuevoTorneoForm

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={returnPath} aria-label="Volver" title="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Nuevo torneo</h1>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <NuevoTorneoForm
          isSiteAdmin={isSiteAdmin}
          clubs={clubs}
          defaultClubId={defaultClubId}
          returnPath={returnPath}
          editQuery={fromClubAdmin ? '?source=club-admin' : ''}
        />
      </Suspense>
    </div>
  )
}
