import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getAllTournamentsWithDates,
  transformTournamentToDisplay,
  type TournamentDisplay
} from "@/lib/tournamentUtils"
import { getTournamentGames, getTournamentRounds } from "@/lib/gameUtils"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import TournamentClient from "./components/tournament-client"
import { Metadata } from "next"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const tournamentId = parseInt(id, 10)
  
  if (isNaN(tournamentId)) {
    return {
      title: 'Torneo no encontrado | FASGBA',
      description: 'El torneo solicitado no existe.',
    }
  }

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournament = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (tournament) {
      return {
        title: `${tournament.title} | FASGBA`,
        description: tournament.description || `Información del torneo ${tournament.title}`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  
  return {
    title: 'Torneo | FASGBA',
    description: 'Información del torneo de ajedrez',
  }
}

export default async function TournamentPage({ params }: PageProps) {
  const { id } = await params
  const tournamentId = parseInt(id, 10)
  
  if (isNaN(tournamentId)) {
    notFound()
  }

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournamentWithDates) {
      notFound()
    }

    const tournament = transformTournamentToDisplay(tournamentWithDates)
    
    // Fetch game data, rounds count, registered teams, and team players in parallel
    const [gamesByRound, totalRounds, registeredTeamsResult, teamPlayersResult] = await Promise.all([
      getTournamentGames(tournamentId, tournament.tournament_type || 'individual'),
      getTournamentRounds(tournamentId),
      tournament.tournament_type === 'team'
        ? supabase
            .from('tournament_teams')
            .select('team_id, teams(id, name, club_id, clubs(id, name))')
            .eq('tournament_id', tournamentId)
        : Promise.resolve({ data: [] }),
      tournament.tournament_type === 'team'
        ? supabase
            .from('tournament_team_players')
            .select('team_id, players(id, full_name, fide_id, rating)')
            .eq('tournament_id', tournamentId)
        : Promise.resolve({ data: [] })
    ])

    // Group players by team
    const playersByTeam: Record<number, { id: number; full_name: string; fide_id?: string; rating?: number }[]> = {}
    for (const entry of (teamPlayersResult.data || []) as any[]) {
      const teamId = entry.team_id
      if (!playersByTeam[teamId]) playersByTeam[teamId] = []
      if (entry.players) {
        playersByTeam[teamId].push(entry.players)
      }
    }

    const registeredTeams = (registeredTeamsResult.data || []).map((t: any) => ({
      team_id: t.team_id,
      name: t.teams?.name || '',
      club_name: t.teams?.clubs?.name || '',
      players: playersByTeam[t.team_id] || [],
    }))

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader pathname="/torneos" />
        <main className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            <TournamentClient
              tournament={tournament}
              initialGamesByRound={gamesByRound}
              initialTotalRounds={totalRounds}
              tournamentId={tournamentId}
              registeredTeams={registeredTeams}
            />
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    )
  } catch (error) {
    console.error('Error loading tournament:', error)
    notFound()
  }
}
