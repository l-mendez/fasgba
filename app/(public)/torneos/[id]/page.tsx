import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getAllTournamentsWithDates,
  transformTournamentToDisplay,
} from "@/lib/tournamentUtils"
import { getTournamentGames, getTournamentRounds } from "@/lib/gameUtils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import TournamentClient from "@/components/tournament/tournament-client"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { getImageUrlNullable } from "@/lib/imageUtils"
import type { TournamentDisplay } from "@/lib/tournament/types"
import {
  absoluteUrl,
  breadcrumbJsonLd,
  FEDERATION_FULL_NAME,
  LOGO_URL,
  ORGANIZATION_ID,
  pageMetadata,
  type JsonLdObject,
} from "@/lib/seo"

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
      title: 'Torneo no encontrado',
      description: 'El torneo solicitado no existe.',
    }
  }

  try {
    const supabase = await createClient()
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    const tournament = tournamentsWithDates.find(t => t.id === tournamentId)
    
    if (tournament) {
      return pageMetadata({
        title: tournament.title,
        description: tournament.description?.slice(0, 200) || `Torneo de ajedrez ${tournament.title}: fechas, inscripción, rondas y resultados.`,
        path: `/torneos/${tournament.id}`,
        image: getImageUrlNullable(tournament.image),
      })
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  
  return {
    title: 'Torneo',
    description: 'Información del torneo de ajedrez',
  }
}

export default async function TournamentPage({ params }: PageProps) {
  const { id } = await params
  const tournamentId = parseInt(id, 10)
  
  if (isNaN(tournamentId)) {
    notFound()
  }

  let data: Awaited<ReturnType<typeof loadTournament>>
  try {
    data = await loadTournament(tournamentId)
  } catch (error) {
    console.error('Error loading tournament:', error)
    notFound()
  }
  const { tournament, gamesByRound, totalRounds, registeredTeams } = data

  return (
    <>
      <JsonLd
        data={[
          tournamentJsonLd(tournament),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Torneos', path: '/torneos' },
            { name: tournament.title, path: `/torneos/${tournament.id}` },
          ]),
        ]}
      />
      <Suspense fallback={<LoadingSpinner />}>
      <TournamentClient
        tournament={tournament}
        initialGamesByRound={gamesByRound}
        initialTotalRounds={totalRounds}
        tournamentId={tournamentId}
        registeredTeams={registeredTeams}
      />
      </Suspense>
    </>
  )
}

// Tournament dates are local calendar days; emit them as plain YYYY-MM-DD.
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function tournamentJsonLd(tournament: TournamentDisplay): JsonLdObject {
  const image = getImageUrlNullable(tournament.image)
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.title,
    description: tournament.description || undefined,
    sport: 'Ajedrez',
    url: absoluteUrl(`/torneos/${tournament.id}`),
    startDate: isoDay(tournament.start_date),
    endDate: isoDay(tournament.end_date ?? tournament.start_date),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: image ? [image] : [LOGO_URL],
    location: {
      '@type': 'Place',
      name: tournament.place || tournament.location || FEDERATION_FULL_NAME,
      address: {
        '@type': 'PostalAddress',
        streetAddress: tournament.location || tournament.place || undefined,
        addressRegion: 'Buenos Aires',
        addressCountry: 'AR',
      },
    },
    organizer: { '@id': ORGANIZATION_ID },
  }
}

async function loadTournament(tournamentId: number) {
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
  for (const entry of teamPlayersResult.data || []) {
    const teamId = entry.team_id
    // Players not assigned to a team can't be listed under one.
    if (teamId === null) continue
    if (!playersByTeam[teamId]) playersByTeam[teamId] = []
    if (entry.players) {
      const { fide_id, rating, ...player } = entry.players
      playersByTeam[teamId].push({ ...player, fide_id: fide_id ?? undefined, rating: rating ?? undefined })
    }
  }

  const registeredTeams = (registeredTeamsResult.data || []).map((t) => ({
    team_id: t.team_id,
    name: t.teams?.name || '',
    club_id: t.teams?.club_id ?? null,
    club_name: t.teams?.clubs?.name || '',
    players: playersByTeam[t.team_id] || [],
  }))

  return { tournament, gamesByRound, totalRounds, registeredTeams }
}
