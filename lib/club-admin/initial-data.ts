import "server-only"

import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { cache } from "react"

import { getClubNews, getClubTournaments } from "@/lib/clubUtils"
import {
  CLUB_PLAYERS_PAGE_SIZE,
  SELECTED_CLUB_COOKIE,
  type ClubAdminActivityItem,
  type ClubAdminClub,
  type ClubAdminPlayer,
  type ClubAdminStats,
  type ClubPlayersPage,
  type ClubPlayersScope,
} from "@/lib/club-admin/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getTournamentParticipantCount } from "@/lib/tournamentUtils"

type AdminClient = ReturnType<typeof createAdminClient>

function parseClubId(id: string | number): number {
  const clubId = typeof id === "number" ? id : Number.parseInt(id, 10)
  if (Number.isNaN(clubId) || clubId <= 0) notFound()
  return clubId
}

function normalizeClub(club: any): ClubAdminClub | null {
  const value = Array.isArray(club) ? club[0] : club
  if (!value) return null

  return {
    id: value.id,
    name: value.name,
    address: value.address ?? null,
    telephone: value.telephone ?? null,
    mail: value.mail ?? null,
    schedule: value.schedule ?? null,
    image: value.image ?? null,
  }
}

async function getAuthenticatedUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) notFound()
  return user.id
}

async function getAuthorNames(supabase: AdminClient, authIds: string[]) {
  const authorNames = new Map<string, string>()
  await Promise.all(authIds.map(async (authId) => {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(authId)
      if (error || !data?.user) return

      const nombre = data.user.user_metadata?.nombre || ""
      const apellido = data.user.user_metadata?.apellido || ""
      const fullName = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido)
      const display = fullName || data.user.email
      if (display) authorNames.set(authId, display)
    } catch (error) {
      console.warn(`Could not resolve club-admin author ${authId}:`, error)
    }
  }))
  return authorNames
}

export const getClubAdminContext = cache(async function getClubAdminContext() {
  const authId = await getAuthenticatedUserId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("club_admins")
    .select(`
      club_id,
      clubs (
        id,
        name,
        address,
        telephone,
        mail,
        schedule,
        image
      )
    `)
    .eq("auth_id", authId)
    .order("club_id", { ascending: true })

  if (error) throw error

  const clubs = (data || [])
    .map((row: any) => normalizeClub(row.clubs))
    .filter((club): club is ClubAdminClub => Boolean(club))

  if (clubs.length === 0) notFound()

  // The selector stores the picked club in a cookie so reloads and round
  // trips through the shared editors keep it.
  const cookieStore = await cookies()
  const preferredId = Number(cookieStore.get(SELECTED_CLUB_COOKIE)?.value)
  const selectedClub = clubs.find((club) => club.id === preferredId) ?? clubs[0]

  return {
    authId,
    clubs,
    selectedClub,
  }
})

export async function requireClubAdminClub(clubIdInput: string | number, context?: Awaited<ReturnType<typeof getClubAdminContext>>) {
  const clubId = parseClubId(clubIdInput)
  const data = context || await getClubAdminContext()
  const club = data.clubs.find((item) => item.id === clubId)
  if (!club) notFound()
  return { ...data, selectedClub: club }
}

export async function getClubDashboardInitialData() {
  const context = await getClubAdminContext()
  const supabase = createAdminClient()
  const clubId = context.selectedClub.id

  const [
    newsData,
    tournamentsData,
    followersData,
    recentNewsData,
    recentTournamentsData,
  ] = await Promise.all([
    supabase.from("news").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("tournaments").select("id", { count: "exact", head: true }).eq("created_by_club_id", clubId),
    supabase.from("user_follows_club").select("auth_id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase
      .from("news")
      .select("id, title, date, extract, created_at, created_by_auth_id")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("tournaments")
      .select(`
        id,
        title,
        description,
        tournamentdates (
          event_date
        )
      `)
      .eq("created_by_club_id", clubId)
      .order("id", { ascending: false })
      .limit(3),
  ])

  if (newsData.error) throw newsData.error
  if (tournamentsData.error) throw tournamentsData.error
  if (followersData.error) throw followersData.error
  if (recentNewsData.error) throw recentNewsData.error
  if (recentTournamentsData.error) throw recentTournamentsData.error

  const stats: ClubAdminStats = {
    noticias: newsData.count || 0,
    torneos: tournamentsData.count || 0,
    torneosActivos: 0,
    seguidores: followersData.count || 0,
    crecimientoSeguidores: 0,
  }

  const authorIds = [...new Set(
    (recentNewsData.data || [])
      .map((news: any) => news.created_by_auth_id)
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
  )]
  const authorNames = await getAuthorNames(supabase, authorIds)
  const recentActivity: ClubAdminActivityItem[] = []

  for (const news of recentNewsData.data || []) {
    recentActivity.push({
      type: "news",
      title: news.title,
      date: news.date || news.created_at || new Date().toISOString(),
      description: news.extract || undefined,
      author: news.created_by_auth_id ? authorNames.get(news.created_by_auth_id) : undefined,
    })
  }

  for (const tournament of recentTournamentsData.data || []) {
    const dates = Array.isArray((tournament as any).tournamentdates)
      ? (tournament as any).tournamentdates
      : []
    recentActivity.push({
      type: "tournament",
      title: tournament.title,
      date: dates[0]?.event_date || new Date().toISOString(),
      description: tournament.description || undefined,
    })
  }

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    selectedClub: context.selectedClub,
    selectedClubId: clubId,
    stats,
    recentActivity: recentActivity.slice(0, 5),
  }
}

export async function queryClubPlayers(
  scope: ClubPlayersScope,
  search: string,
  page: number
): Promise<ClubPlayersPage> {
  const supabase = createAdminClient()
  let query = supabase
    .from("players")
    .select(`
      id,
      full_name,
      fide_id,
      rating,
      club:clubs!players_club_id_fkey (
        id,
        name
      )
    `, { count: "exact" })

  query = scope === "none" ? query.is("club_id", null) : query.eq("club_id", scope)

  // Strip characters that would break the PostgREST `or` filter syntax.
  const term = search.replace(/[,()%*\\]/g, " ").trim()
  if (term) query = query.or(`full_name.ilike.%${term}%,fide_id.ilike.%${term}%`)

  const from = (Math.max(1, page) - 1) * CLUB_PLAYERS_PAGE_SIZE
  const { data, error, count } = await query
    .order("full_name", { ascending: true })
    .range(from, from + CLUB_PLAYERS_PAGE_SIZE - 1)

  if (error) throw error

  return {
    total: count ?? 0,
    players: (data || []).map((player: any): ClubAdminPlayer => ({
      id: player.id,
      full_name: player.full_name,
      fide_id: player.fide_id,
      rating: player.rating,
      club: normalizeClub(player.club),
    })),
  }
}

export async function getClubPlayersInitialData() {
  const { selectedClub } = await getClubAdminContext()
  return {
    selectedClubId: selectedClub.id,
    ...(await queryClubPlayers(selectedClub.id, "", 1)),
  }
}

export async function getClubTeamsInitialData() {
  const { selectedClub } = await getClubAdminContext()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, club_id, created_at")
    .eq("club_id", selectedClub.id)
    .order("name", { ascending: true })

  if (error) throw error

  return {
    selectedClub,
    selectedClubId: selectedClub.id,
    teams: data || [],
  }
}

export async function getClubTournamentsInitialData() {
  const { selectedClub } = await getClubAdminContext()
  const supabase = createAdminClient()
  const tournaments = await getClubTournaments(selectedClub.id)

  return {
    selectedClubId: selectedClub.id,
    tournaments: await Promise.all(
      tournaments.map(async (tournament: any) => ({
        ...tournament,
        participants: await getTournamentParticipantCount(
          supabase,
          tournament.id,
          tournament.tournament_type
        ),
      }))
    ),
  }
}

export async function getClubNewsInitialData() {
  const { selectedClub } = await getClubAdminContext()
  return {
    selectedClubId: selectedClub.id,
    news: await getClubNews(selectedClub.id),
  }
}
