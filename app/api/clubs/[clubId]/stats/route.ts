import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface ClubStats {
  noticias: number
  torneos: number
  torneosActivos: number
  seguidores: number
  crecimientoSeguidores: number
}

interface ActivityItem {
  type: 'news' | 'tournament' | 'follower'
  title: string
  date: string
  description?: string
  author?: string
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
      
      // Get recent tournaments (last 3)
      adminClient
        .from('tournaments')
        .select(`
          id,
          title,
          description,
          created_at,
          tournamentdates (
            event_date
          )
        `)
        .eq('created_by_club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    const stats: ClubStats = {
      noticias: newsData.count || 0,
      torneos: tournamentsData.count || 0,
      torneosActivos: 0, // We would need tournament status to calculate this
      seguidores: followersData.count || 0,
      crecimientoSeguidores: 0, // Would need timestamp data to calculate growth
    }

    // Create unified activity feed
    const activities: ActivityItem[] = []

    // Add recent news
    if (recentNewsData.data) {
      recentNewsData.data.forEach((news: any) => {
        activities.push({
          type: 'news',
          title: news.title,
          date: news.date || news.created_at,
          description: news.extract,
          author: 'Autor del club' // We could join with profiles if needed
        })
      })
    }

    // Add recent tournaments
    if (recentTournamentsData.data) {
      recentTournamentsData.data.forEach((tournament: any) => {
        const tournamentDate = tournament.tournamentdates?.[0]?.event_date || tournament.created_at
        activities.push({
          type: 'tournament',
          title: tournament.title,
          date: tournamentDate,
          description: tournament.description
        })
      })
    }

    // Sort activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Keep only the 5 most recent activities
    const recentActivity = activities.slice(0, 5)

    return NextResponse.json({
      stats,
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching club stats:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 