import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClubProvider } from "../../../context/club-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

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

// Server function to fetch tournament and check authorization
async function getTournamentData(tournamentId: string): Promise<{
  tournament: Tournament | null
  isAuthorized: boolean
  error: string | null
  userClubs: number[]
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
        userClubs: []
      }
    }

    // Get user's admin clubs
    const adminClient = createAdminClient()
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
        userClubs: []
      }
    }

    const userClubs = (adminData || []).map(item => item.club_id)

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
        userClubs
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

    // Check authorization
    const isAuthorized = tournament.created_by_club_id && userClubs.includes(tournament.created_by_club_id)

    if (!isAuthorized) {
      return {
        tournament,
        isAuthorized: false,
        error: tournament.created_by_club_id 
          ? 'No tienes permisos para editar este torneo. Solo los administradores del club que creó el torneo pueden editarlo.'
          : 'Este torneo no fue creado por ningún club, por lo que no puede ser editado desde el panel de club.',
        userClubs
      }
    }

    return {
      tournament,
      isAuthorized: true,
      error: null,
      userClubs
    }

  } catch (error) {
    console.error('Error in getTournamentData:', error)
    return {
      tournament: null,
      isAuthorized: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      userClubs: []
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
  
  // Get user clubs and tournament data in parallel
  const [
    { clubs, selectedClub },
    { tournament, isAuthorized, error, userClubs }
  ] = await Promise.all([
    getUserClubs(),
    getTournamentData(id)
  ])

  // If no clubs, return not found
  if (clubs.length === 0) {
    notFound()
  }

  // Dynamic import the form component only when we need it
  const EditarTorneoForm = (await import("./editar-torneo-form")).EditarTorneoForm

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
            />
          </Suspense>
        )}
      </div>
    </ClubProvider>
  )
}
