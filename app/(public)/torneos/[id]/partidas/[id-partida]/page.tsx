import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { 
  getAllTournamentsWithDates, 
  transformTournamentToDisplay,
  type TournamentDisplay 
} from "@/lib/tournamentUtils"
import { getGameById, type GameDisplay } from "@/lib/gameUtils"
import { ErrorAlert } from "@/components/error-alert"
import { InfoPill } from "@/components/info-pill"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { Calendar, CheckCircle2, ChevronLeft, Clock, Hash, ListOrdered, PlayCircle } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import ChessGameDisplay from "./components/chess-game-display"

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

  const result = game.result === '*' ? null : game.result.replace(/1\/2/g, '½')

  return (
    <>
      <section className="w-full pt-8 md:pt-12">
        <div className="container space-y-3 px-4 md:px-6">
          <Link
            href={`/torneos/${tournamentId}`}
            className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{tournament.title}</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">
              {game.white} vs {game.black}
            </h1>
            {game.whiteTeam && game.blackTeam && (
              <p className="mt-1 text-muted-foreground">
                {game.whiteTeam} vs {game.blackTeam}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <InfoPill icon={result ? CheckCircle2 : PlayCircle}>{result ?? 'En juego'}</InfoPill>
            <span className="flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4 text-amber" />
              Ronda {game.round}
            </span>
            {game.board && (
              <span className="flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-amber" />
                Mesa {game.board}
              </span>
            )}
            {game.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber" />
                {formatArgentinaDateOnly(game.date)}
              </span>
            )}
            {game.time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber" />
                {game.time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          {error && <ErrorAlert message={error} className="mb-6" />}
          <ChessGameDisplay game={game} />
        </div>
      </section>
    </>
  )
}
