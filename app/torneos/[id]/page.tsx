import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { 
  getAllTournamentsWithDates, 
  transformTournamentToDisplay,
  type TournamentDisplay 
} from "@/lib/tournamentUtils"
import { getTournamentGames, getTournamentRounds } from "@/lib/gameUtils"
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
    
    // Fetch game data and rounds count in parallel
    const [gamesByRound, totalRounds] = await Promise.all([
      getTournamentGames(tournamentId, tournament.tournament_type || 'individual'),
      getTournamentRounds(tournamentId)
    ])

    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<LoadingSpinner />}>
          <TournamentClient
            tournament={tournament}
            initialGamesByRound={gamesByRound}
            initialTotalRounds={totalRounds}
            tournamentId={tournamentId}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading tournament:', error)
    notFound()
  }
}
