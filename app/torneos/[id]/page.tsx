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
import { Calendar, MapPin, Trophy, Clock } from "lucide-react"
import RoundsSection from "./components/rounds-section"
import { Metadata } from "next"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Mock data structures for games and standings (to be replaced with real data later)
interface Game {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
}

interface StandingEntry {
  position: number
  player: string
  rating?: number
  points: number
  games: number
  performance?: number
  club?: string
}

// Generate metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const tournamentId = parseInt(id)
  
  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournament = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournament) {
      return {
        title: 'Torneo no encontrado - FASGBA',
      }
    }

    const tournamentDisplay = transformTournamentToDisplay(tournament)
    
    return {
      title: `${tournament.title} - Torneo FASGBA`,
      description: tournament.description || `Resultados y posiciones del torneo ${tournament.title}`,
      openGraph: {
        title: `${tournament.title} - Torneo FASGBA`,
        description: tournament.description || `Resultados y posiciones del torneo ${tournament.title}`,
        images: tournament.image ? [tournament.image] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Torneo - FASGBA',
    }
  }
}

// Mock function to generate sample games (replace with real data later)
function generateMockGames(rounds: number): Game[] {
  const mockPlayers = [
    "García, Juan", "Rodríguez, María", "López, Carlos", "Martínez, Ana",
    "González, Pedro", "Sánchez, Laura", "Pérez, Diego", "Fernández, Sofía",
    "Torres, Miguel", "Ruiz, Carmen", "Morales, Roberto", "Jiménez, Elena"
  ]
  
  const games: Game[] = []
  let gameId = 1
  
  for (let round = 1; round <= rounds; round++) {
    const playersThisRound = [...mockPlayers].sort(() => 0.5 - Math.random())
    for (let i = 0; i < playersThisRound.length; i += 2) {
      if (i + 1 < playersThisRound.length) {
        const results = ['1-0', '0-1', '1/2-1/2', '*'] as const
        games.push({
          id: gameId++,
          round,
          white: playersThisRound[i],
          black: playersThisRound[i + 1],
          result: results[Math.floor(Math.random() * (round <= 2 ? 4 : 3))], // Current rounds show *, completed ones show results
          whiteRating: 1800 + Math.floor(Math.random() * 400),
          blackRating: 1800 + Math.floor(Math.random() * 400),
          board: Math.floor(i / 2) + 1
        })
      }
    }
  }
  
  return games
}

// Mock function to generate standings
function generateMockStandings(): StandingEntry[] {
  return [
    { position: 1, player: "García, Juan", rating: 2134, points: 4.5, games: 5, performance: 2245, club: "Club Ajedrez Buenos Aires" },
    { position: 2, player: "Rodríguez, María", rating: 2089, points: 4.0, games: 5, performance: 2198, club: "Club San Martín" },
    { position: 3, player: "López, Carlos", rating: 1987, points: 4.0, games: 5, performance: 2187, club: "Club Quilmes" },
    { position: 4, player: "González, Pedro", rating: 2156, points: 3.5, games: 5, performance: 2089, club: "Club Ajedrez Buenos Aires" },
    { position: 5, player: "Martínez, Ana", rating: 1934, points: 3.5, games: 5, performance: 2134, club: "Club Lanús" },
    { position: 6, player: "Sánchez, Laura", rating: 2012, points: 3.0, games: 5, performance: 2034, club: "Club San Martín" },
    { position: 7, player: "Pérez, Diego", rating: 1876, points: 3.0, games: 5, performance: 2076, club: "Club Avellaneda" },
    { position: 8, player: "Torres, Miguel", rating: 1798, points: 2.5, games: 5, performance: 1998, club: "Club Quilmes" },
    { position: 9, player: "Fernández, Sofía", rating: 1923, points: 2.0, games: 5, performance: 1823, club: "Club Lanús" },
    { position: 10, player: "Ruiz, Carmen", rating: 1756, points: 1.5, games: 5, performance: 1656, club: "Club Avellaneda" },
  ]
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournamentId = parseInt(id)
  
  if (isNaN(tournamentId)) {
    notFound()
  }

  let tournament: TournamentDisplay | null = null
  let error: string | null = null

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (!tournamentWithDates) {
      notFound()
    }

    tournament = transformTournamentToDisplay(tournamentWithDates)
  } catch (err) {
    console.error('Error loading tournament:', err)
    error = 'Error al cargar el torneo'
  }

  if (!tournament) {
    notFound()
  }

  // Generate mock data based on tournament info
  const totalRounds = tournament.rounds || 6
  const games = generateMockGames(totalRounds)
  const standings = generateMockStandings()
  
  // Group games by round
  const gamesByRound = games.reduce((acc, game) => {
    if (!acc[game.round]) {
      acc[game.round] = []
    }
    acc[game.round].push(game)
    return acc
  }, {} as Record<number, Game[]>)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname={`/torneos/${tournamentId}`} />
      <main className="flex-1">
        {/* Tournament Header */}
        <section className="w-full py-8 md:py-12 bg-gradient-to-b from-terracotta/10 to-amber/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-terracotta">
                    {tournament.title}
                  </h1>
                  {tournament.description && (
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                      {tournament.description}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={`border-amber text-sm ${
                    tournament.is_ongoing ? 'bg-green-100 text-green-800 border-green-200' :
                    tournament.is_upcoming ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {tournament.is_ongoing ? 'En curso' : tournament.is_upcoming ? 'Próximo' : 'Finalizado'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber" />
                  <span>{tournament.formatted_start_date}</span>
                  {tournament.end_date && tournament.formatted_end_date && 
                    tournament.formatted_start_date !== tournament.formatted_end_date && (
                    <span> - {tournament.formatted_end_date}</span>
                  )}
                </div>
                {tournament.place && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber" />
                    <span>{tournament.place}</span>
                  </div>
                )}
                {tournament.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber" />
                    <span>{tournament.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber" />
                  <span>{totalRounds} rondas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tournament Content */}
        <section className="w-full py-8 md:py-12">
          <div className="container px-4 md:px-6">
            {error && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
              {/* Standings Section */}
              <div className="lg:col-span-5">
                <Card className="border-amber/20 h-fit">
                  <CardHeader>
                    <CardTitle className="text-terracotta flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Tabla de Posiciones
                    </CardTitle>
                    <CardDescription>
                      Clasificación actualizada del torneo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-amber/20">
                            <th className="text-left py-3 px-2 font-medium text-terracotta">Pos</th>
                            <th className="text-left py-3 px-2 font-medium text-terracotta">Jugador</th>
                            <th className="text-center py-3 px-2 font-medium text-terracotta">Rating</th>
                            <th className="text-center py-3 px-2 font-medium text-terracotta">Pts</th>
                            <th className="text-center py-3 px-2 font-medium text-terracotta">PJ</th>
                            <th className="text-center py-3 px-2 font-medium text-terracotta">Perf</th>
                            <th className="text-left py-3 px-2 font-medium text-terracotta max-lg:hidden">Club</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((entry, index) => (
                            <tr 
                              key={entry.position} 
                              className={`border-b border-amber/10 hover:bg-amber/5 ${
                                index < 3 ? 'font-medium' : ''
                              }`}
                            >
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  {entry.position <= 3 && (
                                    <Trophy className={`h-4 w-4 ${
                                      entry.position === 1 ? 'text-yellow-500' :
                                      entry.position === 2 ? 'text-gray-400' :
                                      'text-amber-600'
                                    }`} />
                                  )}
                                  {entry.position}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div>
                                  <div className="font-medium">{entry.player}</div>
                                  <div className="text-xs text-muted-foreground lg:hidden">
                                    {entry.club}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center py-3 px-2 text-muted-foreground text-sm">
                                {entry.rating}
                              </td>
                              <td className="text-center py-3 px-2 font-bold text-terracotta">
                                {entry.points}
                              </td>
                              <td className="text-center py-3 px-2 text-sm">{entry.games}</td>
                              <td className="text-center py-3 px-2 text-muted-foreground text-sm">
                                {entry.performance}
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground max-lg:hidden">
                                {entry.club}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rounds Section */}
              <RoundsSection 
                totalRounds={totalRounds} 
                gamesByRound={gamesByRound} 
                tournamentId={tournamentId} 
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
