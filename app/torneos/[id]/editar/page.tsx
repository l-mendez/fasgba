import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getTournamentGames, getTournamentRounds } from "@/lib/gameUtils"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  tournament_type?: 'individual' | 'team' | null
  players_per_team?: number | null
  max_teams?: number | null
  registration_deadline?: string | null
  team_match_points?: Record<string, number> | null
}

interface Round {
  id: number
  round_number: number
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
  rounds: Round[]
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
        isClubAdmin: false,
        rounds: []
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
        isClubAdmin: false,
        rounds: []
      }
    }

    const userClubs = (adminData || []).map(item => item.club_id)
    const isClubAdmin = userClubs.length > 0

    // Fetch tournament data and rounds in parallel
    const [tournamentResult, roundsResult] = await Promise.all([
      adminClient
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
          tournament_type,
          players_per_team,
          max_teams,
          registration_deadline,
          team_match_points,
          tournamentdates (
            event_date
          )
        `)
        .eq('id', tournamentId)
        .single(),
      adminClient
        .from('rounds')
        .select('id, round_number')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
    ])

    const { data: tournamentData, error: tournamentError } = tournamentResult
    const { data: roundsData, error: roundsError } = roundsResult

    if (tournamentError || !tournamentData) {
      console.error('Error fetching tournament:', tournamentError)
      return {
        tournament: null,
        isAuthorized: false,
        error: 'Torneo no encontrado',
        isSiteAdmin,
        isClubAdmin,
        rounds: []
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
      tournament_type: tournamentData.tournament_type,
      players_per_team: tournamentData.players_per_team,
      max_teams: tournamentData.max_teams,
      registration_deadline: tournamentData.registration_deadline,
      team_match_points: tournamentData.team_match_points,
      all_dates: (tournamentData.tournamentdates || []).map((date: any) => date.event_date)
    }

    const rounds: Round[] = roundsData || []

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
      isClubAdmin,
      rounds
    }

  } catch (error) {
    console.error('Error in getTournamentData:', error)
    return {
      tournament: null,
      isAuthorized: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      isSiteAdmin: false,
      isClubAdmin: false,
      rounds: []
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
  const { tournament, isAuthorized, error, isSiteAdmin, isClubAdmin, rounds } = await getTournamentData(id)

  // Prefetch existing games if we have a tournament and user is authorized
  let initialGames: any[] = []
  if (tournament && isAuthorized) {
    try {
      const gamesByRound = await getTournamentGames(
        parseInt(id, 10),
        (tournament.tournament_type as 'individual' | 'team') || 'individual'
      )
      // Flatten the games into a single array for the GameManagement component
      initialGames = Object.values(gamesByRound).flat()
    } catch (gamesError) {
      console.error('Error prefetching tournament games:', gamesError)
      initialGames = []
    }
  }

  // If user has no permissions at all, return not found
  if (!isSiteAdmin && !isClubAdmin) {
    notFound()
  }

  // Dynamic import the form component only when we need it
  const EditarTorneoForm = (await import("./editar-torneo-form")).EditarTorneoForm

  // Dynamic import management components
  let GameManagement, RoundManagement, TeamManagement
  if (tournament && isAuthorized) {
    const [gameManagementModule, roundManagementModule, teamManagementModule] = await Promise.all([
      import("../components/game-management"),
      import("../components/round-management"),
      import("../components/team-management")
    ])
    GameManagement = gameManagementModule.default
    RoundManagement = roundManagementModule.default
    TeamManagement = teamManagementModule.default
  }

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
          <Tabs defaultValue="info" className="w-full">
            <TabsList className={`grid w-full ${tournament.tournament_type === 'team' ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="info">Información</TabsTrigger>
              {tournament.tournament_type === 'team' && (
                <TabsTrigger value="teams">Equipos</TabsTrigger>
              )}
              <TabsTrigger value="games">Partidas</TabsTrigger>
              <TabsTrigger value="rounds">Rondas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-6">
              <EditarTorneoForm 
                tournament={tournament}
                tournamentId={id}
                isSiteAdmin={isSiteAdmin}
              />
            </TabsContent>

            {TeamManagement && tournament.tournament_type === 'team' && (
              <TabsContent value="teams" className="mt-6">
                <TeamManagement
                  tournamentId={id}
                  tournamentType={tournament.tournament_type as 'individual' | 'team' || 'individual'}
                />
              </TabsContent>
            )}
            
            {GameManagement && (
              <TabsContent value="games" className="mt-6">
                <GameManagement
                  tournamentId={id}
                  tournamentType={tournament.tournament_type as 'individual' | 'team' || 'individual'}
                  games={initialGames}
                  rounds={rounds}
                />
              </TabsContent>
            )}

            {RoundManagement && (
              <TabsContent value="rounds" className="mt-6">
                <RoundManagement
                  tournamentId={id}
                  tournamentType={tournament.tournament_type as 'individual' | 'team' || 'individual'}
                />
              </TabsContent>
            )}
          </Tabs>
        </Suspense>
      )}
    </div>
  )
} 