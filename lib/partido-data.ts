import { cache } from 'react'

import { getAllClubs, type Club } from '@/lib/clubUtils'
import { mentionsPartido, type Partido } from '@/lib/partidos'
import { getAllProfesores, type ProfesorWithClub } from '@/lib/profesorUtils'
import { normalizePlayer, selectPlayersPage, sortPlayersByRatingType } from '@/lib/rankingDisplay'
import { getCachedLatestRankingData } from '@/lib/rankingStorage'
import type { Player } from '@/lib/rankingUtils'
import { getAdminClient } from '@/lib/supabase/admin'
import { getAllTournamentsForDisplay, getTournamentStatus, type TournamentDisplay } from '@/lib/tournamentUtils'
import type { TournamentStatus } from '@/lib/utils/constants'
import { safe } from '@/lib/utils/safe'

export type PartidoData = {
  partido: Partido
  clubs: Club[]
  profesores: ProfesorWithClub[]
  tournaments: { torneo: TournamentDisplay; status: TournamentStatus }[]
  tournamentsAreUpcoming: boolean
  topPlayers: Player[]
}

// Everything is fetched once per render pass and shared by every partido.
const loadAll = cache(async () => {
  const [clubs, profesores, tournaments, ranking] = await Promise.all([
    safe(() => getAllClubs() as Promise<Club[]>, [] as Club[], 'Error fetching clubs:'),
    safe(() => getAllProfesores(), [] as ProfesorWithClub[], 'Error fetching profesores:'),
    safe(() => getAllTournamentsForDisplay(getAdminClient()), [] as TournamentDisplay[], 'Error fetching tournaments:'),
    safe(getCachedLatestRankingData, { players: [] }, 'Error fetching ranking:'),
  ])
  return { clubs, profesores, tournaments, players: ranking.players.map(normalizePlayer) }
})

const ZONA_SUR = /zona sur/i

export async function loadPartidoData(partido: Partido): Promise<PartidoData> {
  const all = await loadAll()

  const clubs = all.clubs.filter((club) => mentionsPartido(partido, `${club.name} ${club.address ?? ''}`))
  const clubIds = new Set(clubs.map((club) => club.id))

  // Local teachers first, then those who teach across the whole zona sur.
  const local = all.profesores.filter((p) => (p.club_id !== null && clubIds.has(p.club_id)) || mentionsPartido(partido, p.zona))
  const zonaSur = all.profesores.filter((p) => !local.includes(p) && ZONA_SUR.test(p.zona ?? ''))
  const profesores = [...local, ...zonaSur]

  const inPartido = all.tournaments.filter((t) => mentionsPartido(partido, `${t.place ?? ''} ${t.location ?? ''}`))
  const current = inPartido.filter((t) => t.is_upcoming || t.is_ongoing).sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
  const recent = inPartido.filter((t) => t.is_past).sort((a, b) => b.start_date.getTime() - a.start_date.getTime())
  const shown = current.length > 0 ? current.slice(0, 6) : recent.slice(0, 3)

  const rankingClubs = new Set(partido.rankingClubs)
  const topPlayers = selectPlayersPage(
    sortPlayersByRatingType(all.players.filter((player) => rankingClubs.has(player.club)), 'standard'),
    { activeFilter: 'active', pageSize: 10 }
  ).players

  return {
    partido,
    clubs,
    profesores,
    tournaments: shown.map((torneo) => ({ torneo, status: getTournamentStatus(torneo) })),
    tournamentsAreUpcoming: current.length > 0,
    topPlayers,
  }
}
