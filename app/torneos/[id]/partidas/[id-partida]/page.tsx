import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { 
  getAllTournamentsWithDates, 
  transformTournamentToDisplay,
  type TournamentDisplay 
} from "@/lib/tournamentUtils"
import { getGameById, type GameDisplay } from "@/lib/gameUtils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Trophy, Clock, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import ChessGameDisplay from "./components/chess-game-display"
import { cn } from "@/lib/utils"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Generate metadata
export async function generateMetadata({ params }: { 
  params: Promise<{ id: string; 'id-partida': string }> 
}): Promise<Metadata> {
  const { id, 'id-partida': partidaId } = await params
  const tournamentId = parseInt(id)
  const gameId = parseInt(partidaId)
  
  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournament = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournament) {
      return {
        title: 'Partida no encontrada - FASGBA',
      }
    }

    const tournamentDisplay = transformTournamentToDisplay(tournament)
    const game = await getGameById(gameId, tournamentDisplay.tournament_type || 'individual')
    
    if (!game) {
      return {
        title: 'Partida no encontrada - FASGBA',
      }
    }

    return {
      title: `${game.white} vs ${game.black} - ${tournament.title} - FASGBA`,
      description: `Partida de la ronda ${game.round} entre ${game.white} y ${game.black} en el torneo ${tournament.title}`,
    }
  } catch (error) {
    return {
      title: 'Partida - FASGBA',
    }
  }
}

export default async function GamePage({ params }: { 
  params: Promise<{ id: string; 'id-partida': string }> 
}) {
  const { id, 'id-partida': partidaId } = await params
  const tournamentId = parseInt(id)
  const gameId = parseInt(partidaId)
  
  if (isNaN(tournamentId) || isNaN(gameId)) {
    notFound()
  }

  let tournament: TournamentDisplay | null = null
  let game: GameDisplay | null = null
  let error: string | null = null

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournamentWithDates) {
      notFound()
    }

    tournament = transformTournamentToDisplay(tournamentWithDates)
    game = await getGameById(gameId, tournament.tournament_type || 'individual')
    
    if (!game) {
      notFound()
    }
  } catch (err) {
    console.error('Error loading tournament or game:', err)
    error = 'Error al cargar la partida'
  }

  if (!tournament || !game) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname={`/torneos/${tournamentId}/partidas/${gameId}`} />
      <main className="flex-1">
        {/* Game Header */}
        <section className="w-full py-6 md:py-8 bg-gradient-to-b from-terracotta/10 to-amber/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="text-terracotta hover:bg-terracotta/10">
                  <Link href={`/torneos/${tournamentId}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver al torneo
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight text-terracotta">
                  {game.whiteTeam && game.blackTeam ? (
                    <>
                      {game.whiteTeam} vs {game.blackTeam}
                      <div className="text-lg md:text-xl font-medium text-muted-foreground mt-1">
                        {game.white} vs {game.black}
                      </div>
                    </>
                  ) : (
                    `${game.white} vs ${game.black}`
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {tournament.title} - Ronda {game.round}
                  {game.whiteTeam && game.blackTeam && (
                    <span className="ml-2 text-xs bg-terracotta/10 text-terracotta px-2 py-1 rounded">
                      Torneo por Equipos
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {game.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber" />
                    <span>{new Date(game.date).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {game.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber" />
                    <span>{game.time}</span>
                  </div>
                )}
                {game.board && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber" />
                    <span>Mesa {game.board}</span>
                  </div>
                )}
                <Badge 
                  variant={game.result === '*' ? 'default' : 'outline'}
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    game.result 
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                      : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                  )}
                >
                  {game.result === '*' ? 'En juego' : `Resultado: ${game.result}`}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Game Content */}
        <section className="w-full py-8 md:py-12">
          <div className="container px-4 md:px-6">
            {error && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <ChessGameDisplay game={game} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
} 