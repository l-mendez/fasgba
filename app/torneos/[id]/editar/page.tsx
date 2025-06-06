import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

// Metadata generation
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  
  try {
    const { tournament } = await getTournamentData(id)
    
    if (tournament) {
      return {
        title: `Editar ${tournament.title} | FASGBA`,
        description: `Editar torneo: ${tournament.title}`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  
  return {
    title: 'Editar Torneo | FASGBA',
    description: 'Editar información del torneo',
  }
}

interface Tournament {
  id: string
  title: string
  description?: string | null
  time?: string | null
  place?: string | null
  location?: string | null
  rounds?: number | null
  pace?: string | null
  inscription_details?: string | null
  cost?: string | null
  prizes?: string | null
  image?: string | null
  all_dates?: string[]
  formatted_all_dates?: string[]
  created_by_club_id?: number
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

// Server function to fetch tournament and check authorization
async function getTournamentData(tournamentId: string): Promise<{
  tournament: Tournament | null
  isAuthorized: boolean
  error: string | null
  isSiteAdmin: boolean
  isClubAdmin: boolean
}> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        tournament: null,
        isAuthorized: false,
        error: 'Usuario no autenticado',
        isSiteAdmin: false,
        isClubAdmin: false
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
      .select('club_id')
      .eq('auth_id', user.id)

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return {
        tournament: null,
        isAuthorized: false,
        error: 'Error verificando permisos de club',
        isSiteAdmin,
        isClubAdmin: false
      }
    }

    const userClubs = (adminData || []).map(item => item.club_id)
    const isClubAdmin = userClubs.length > 0

    // Fetch tournament data
    const { data: tournamentData, error: tournamentError } = await adminClient
      .from('tournaments')
      .select(`
        id,
        title,
        description,
        time,
        place,
        location,
        rounds,
        pace,
        inscription_details,
        cost,
        prizes,
        image,
        created_by_club_id,
        tournamentdates (
          event_date
        )
      `)
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournamentData) {
      console.error('Error fetching tournament:', tournamentError)
      return {
        tournament: null,
        isAuthorized: false,
        error: 'Torneo no encontrado',
        isSiteAdmin,
        isClubAdmin
      }
    }

    // Transform tournament data
    const tournament: Tournament = {
      id: tournamentData.id,
      title: tournamentData.title,
      description: tournamentData.description,
      time: tournamentData.time,
      place: tournamentData.place,
      location: tournamentData.location,
      rounds: tournamentData.rounds,
      pace: tournamentData.pace,
      inscription_details: tournamentData.inscription_details,
      cost: tournamentData.cost,
      prizes: tournamentData.prizes,
      image: tournamentData.image,
      created_by_club_id: tournamentData.created_by_club_id,
      all_dates: (tournamentData.tournamentdates || []).map((date: any) => date.event_date)
    }

    // Check authorization:
    // 1. Site admins can edit any tournament
    // 2. Club admins can only edit tournaments created by their clubs
    let isAuthorized = false
    let errorMessage = null

    if (isSiteAdmin) {
      isAuthorized = true
    } else if (isClubAdmin && tournament.created_by_club_id) {
      isAuthorized = userClubs.includes(tournament.created_by_club_id)
      if (!isAuthorized) {
        errorMessage = 'No tienes permisos para editar este torneo. Solo los administradores del club que creó el torneo pueden editarlo.'
      }
    } else if (isClubAdmin && !tournament.created_by_club_id) {
      errorMessage = 'Este torneo no fue creado por ningún club, por lo que no puede ser editado desde el panel de club.'
    } else {
      errorMessage = 'No tienes permisos para editar torneos. Debes ser administrador del sitio o administrador del club que creó el torneo.'
    }

    return {
      tournament,
      isAuthorized,
      error: errorMessage,
      isSiteAdmin,
      isClubAdmin
    }

  } catch (error) {
    console.error('Error in getTournamentData:', error)
    return {
      tournament: null,
      isAuthorized: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      isSiteAdmin: false,
      isClubAdmin: false
    }
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Main server component
export default async function EditarTorneoPage({ params }: PageProps) {
  const { id } = await params
  
  // Check authentication first - if not authenticated, redirect to login
  const isAuthenticated = await checkAuthentication()
  
  if (!isAuthenticated) {
    redirect('/login')
  }
  
  // Get tournament data and authorization
  const { tournament, isAuthorized, error, isSiteAdmin, isClubAdmin } = await getTournamentData(id)

  // If user has no permissions at all, return not found
  if (!isSiteAdmin && !isClubAdmin) {
    notFound()
  }

  // Dynamic import the form component only when we need it
  const EditarTorneoForm = (await import("./editar-torneo-form")).EditarTorneoForm

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">
            {tournament ? 'Editar Torneo' : 'Error'}
          </h1>
          <p className="text-muted-foreground">
            {tournament 
              ? `Editando: ${tournament.title}` 
              : 'No se pudo cargar el torneo'
            }
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tournament && !isAuthorized && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Torneo</CardTitle>
            <CardDescription>Los datos del torneo están disponibles pero no tienes permisos para editarlo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Título:</strong> {tournament.title}</p>
              {tournament.description && (
                <p><strong>Descripción:</strong> {tournament.description}</p>
              )}
              {tournament.place && (
                <p><strong>Lugar:</strong> {tournament.place}</p>
              )}
              {tournament.created_by_club_id && (
                <p><strong>Creado por Club ID:</strong> {tournament.created_by_club_id}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tournament && isAuthorized && (
        <Suspense fallback={<LoadingSpinner />}>
          <EditarTorneoForm 
            tournament={tournament}
            tournamentId={id}
            isSiteAdmin={isSiteAdmin}
          />
        </Suspense>
      )}
    </div>
  )
} 