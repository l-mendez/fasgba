import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { DbRow, NewsRow, TournamentRow } from "@/lib/db-types"
import type { ClubAdminActivityItem, ClubAdminStats, ClubStatsResponse } from "@/lib/club-admin/types"

// Shapes of the "recent news" / "recent tournaments" selects below
type RecentNewsRow = Pick<NewsRow, 'id' | 'title' | 'date' | 'extract' | 'created_at' | 'created_by_auth_id'>
type RecentTournamentRow = Pick<TournamentRow, 'id' | 'title' | 'description'> & {
  tournamentdates: Pick<DbRow<'tournamentdates'>, 'event_date'>[] | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return NextResponse.json(
        { error: "ID de club inválido" },
        { status: 400 }
      )
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Check if user is admin of this club
    const adminClient = createAdminClient()
    const { data: adminCheck, error: adminError } = await adminClient
      .from('club_admins')
      .select('club_id')
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este club" },
        { status: 403 }
      )
    }

    // Fetch data in parallel
    const [
      newsData,
      tournamentsData,
      followersData,
      recentNewsData,
      recentTournamentsData
    ] = await Promise.all([
      // Count news
      adminClient
        .from('news')
        .select('id', { count: 'exact' })
        .eq('club_id', clubId),
      
      // Count tournaments
      adminClient
        .from('tournaments')
        .select('id', { count: 'exact' })
        .eq('created_by_club_id', clubId),
      
      // Count followers
      adminClient
        .from('user_follows_club')
        .select('auth_id', { count: 'exact' })
        .eq('club_id', clubId),
      
      // Get recent news (last 3)
      adminClient
        .from('news')
        .select('id, title, date, extract, created_at, created_by_auth_id')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Get recent tournaments (last 3). `tournaments` has no created_at; the
      // id is serial, so the highest ids are the most recently created.
      adminClient
        .from('tournaments')
        .select(`
          id,
          title,
          description,
          tournamentdates (
            event_date
          )
        `)
        .eq('created_by_club_id', clubId)
        .order('id', { ascending: false })
        .limit(3)
    ])

    const stats: ClubAdminStats = {
      noticias: newsData.count || 0,
      torneos: tournamentsData.count || 0,
      torneosActivos: 0, // We would need tournament status to calculate this
      seguidores: followersData.count || 0,
      crecimientoSeguidores: 0, // Would need timestamp data to calculate growth
    }

    // Create unified activity feed
    const activities: ClubAdminActivityItem[] = []

    // Resolve author display names for recent news (deduped, parallel)
    const authorIds = [...new Set(
      (recentNewsData.data || [])
        .map((n: RecentNewsRow) => n.created_by_auth_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )]

    const authorNames = new Map<string, string>()
    await Promise.all(authorIds.map(async (authId) => {
      try {
        const { data, error } = await adminClient.auth.admin.getUserById(authId)
        if (error || !data?.user) return
        const nombre = data.user.user_metadata?.nombre || ''
        const apellido = data.user.user_metadata?.apellido || ''
        const fullName = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido)
        const display = fullName || data.user.email
        if (display) authorNames.set(authId, display)
      } catch (err) {
        console.warn(`Could not resolve author ${authId}:`, err)
      }
    }))

    // Add recent news
    if (recentNewsData.data) {
      recentNewsData.data.forEach((news: RecentNewsRow) => {
        activities.push({
          type: 'news',
          title: news.title,
          date: news.date || news.created_at || new Date().toISOString(),
          description: news.extract || undefined,
          author: news.created_by_auth_id ? authorNames.get(news.created_by_auth_id) : undefined,
        })
      })
    }

    // Add recent tournaments
    if (recentTournamentsData.data) {
      recentTournamentsData.data.forEach((tournament: RecentTournamentRow) => {
        activities.push({
          type: 'tournament',
          title: tournament.title,
          date: tournament.tournamentdates?.[0]?.event_date || new Date().toISOString(),
          description: tournament.description || undefined
        })
      })
    }

    // Sort activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Keep only the 5 most recent activities
    const recentActivity = activities.slice(0, 5)

    const body: ClubStatsResponse = { stats, recentActivity }
    return NextResponse.json(body)

  } catch (error) {
    console.error('Error fetching club stats:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 