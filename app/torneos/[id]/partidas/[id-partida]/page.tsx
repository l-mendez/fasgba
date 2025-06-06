import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { 
  getAllTournamentsWithDates, 
  transformTournamentToDisplay,
  type TournamentDisplay 
} from "@/lib/tournamentUtils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Trophy, Clock, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import ChessGameDisplay from "./components/chess-game-display"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Mock game data (to be replaced with real data later)
interface GameDetails {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
  fen?: string
  pgn?: string
  date?: string
  time?: string
}

// Mock function to get game by ID (replace with real data later)
function getGameById(gameId: number): GameDetails | null {
  // Mock game data
  const mockGames: GameDetails[] = [
    {
      id: 1,
      round: 1,
      white: "García, Juan",
      black: "Rodríguez, María",
      result: "1-0",
      whiteRating: 2134,
      blackRating: 2089,
      board: 1,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      pgn: `[Event "Torneo FASGBA"]
[Site "Buenos Aires"]
[Date "2024.01.15"]
[Round "1"]
[White "García, Juan"]
[Black "Rodríguez, María"]
[Result "1-0"]
[WhiteElo "2134"]
[BlackElo "2089"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 1-0`,
      date: "2024-01-15",
      time: "14:30"
    },
    {
      id: 2,
      round: 1,
      white: "López, Carlos",
      black: "González, Pedro",
      result: "*",
      whiteRating: 1987,
      blackRating: 2156,
      board: 2,
      fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      pgn: `[Event "Torneo FASGBA"]
[Site "Buenos Aires"]
[Date "2024.01.15"]
[Round "1"]
[White "López, Carlos"]
[Black "González, Pedro"]
[Result "*"]
[WhiteElo "1987"]
[BlackElo "2156"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 *`,
      date: "2024-01-15",
      time: "14:30"
    }
  ]
  
  return mockGames.find(game => game.id === gameId) || null
}

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
    const game = getGameById(gameId)
    
    if (!tournament || !game) {
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
  let game: GameDetails | null = null
  let error: string | null = null

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournamentWithDates) {
      notFound()
    }

    tournament = transformTournamentToDisplay(tournamentWithDates)
    game = getGameById(gameId)
    
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
                  {game.white} vs {game.black}
                </h1>
                <p className="text-muted-foreground">
                  {tournament.title} - Ronda {game.round}
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
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber" />
                  <span>Mesa {game.board}</span>
                </div>
                <Badge 
                  variant={game.result === '*' ? 'default' : 'outline'}
                  className={
                    game.result === '*' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'border-amber'
                  }
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