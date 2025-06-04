import Link from "next/link"
import { notFound } from "next/navigation"
import { FileText, Trophy, Users } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClubProvider } from "./context/club-provider"
import { QuickActions } from "./components/quick-actions"

// Client component for context-aware actions
"use client"
import { useClubContext } from "./context/club-provider"

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

// Database Club interface (matches actual schema)
interface DbClub {
  id: number
  name: string
  address?: string
  telephone?: string
  mail?: string
  schedule?: string
}

// Expected Club interface (matches ClubProvider context)
interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Function to map database club to expected club format
function mapDbClubToClub(dbClub: DbClub): Club {
  return {
    id: dbClub.id,
    name: dbClub.name,
    description: undefined,
    location: dbClub.address,
    website: undefined,
    email: dbClub.mail,
    phone: dbClub.telephone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Server component to get user's clubs
async function getUserClubs(): Promise<{ clubs: Club[], selectedClub: Club | null }> {
  try {
    // Use the proper server client that handles authentication correctly
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { clubs: [], selectedClub: null }
    }

    // Get clubs where user is admin using the admin client for the query
    const adminClient = createAdminClient()
    const { data: adminData, error: adminError } = await adminClient
      .from('club_admins')
      .select(`
        club_id,
        clubs (
          id,
          name,
          address,
          telephone,
          mail,
          schedule
        )
      `)
      .eq('auth_id', user.id)

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return { clubs: [], selectedClub: null }
    }

    // Properly type and filter the clubs data
    const dbClubs: DbClub[] = (adminData || [])
      .filter(item => item.clubs)
      .map(item => {
        const club = item.clubs as any
        return {
          id: club.id,
          name: club.name,
          address: club.address,
          telephone: club.telephone,
          mail: club.mail,
          schedule: club.schedule
        }
      })

    // Convert to expected Club format
    const clubs: Club[] = dbClubs.map(mapDbClubToClub)

    const selectedClub = clubs.length > 0 ? clubs[0] : null

    return { clubs, selectedClub }
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return { clubs: [], selectedClub: null }
  }
}

// Server function to fetch club statistics
async function getClubStats(clubId: number): Promise<{ stats: ClubStats, recentActivity: ActivityItem[] }> {
  try {
    const adminClient = createAdminClient()

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

    return { stats, recentActivity }
  } catch (error) {
    console.error('Error fetching club stats:', error)
    return {
      stats: {
        noticias: 0,
        torneos: 0,
        torneosActivos: 0,
        seguidores: 0,
        crecimientoSeguidores: 0,
      },
      recentActivity: []
    }
  }
}

// Main server component
export default async function ClubAdminDashboard() {
  const { clubs, selectedClub } = await getUserClubs()
  
  // If no clubs, return not found
  if (clubs.length === 0) {
    notFound()
  }

  // Get club statistics if we have a selected club
  const { stats, recentActivity } = selectedClub 
    ? await getClubStats(selectedClub.id)
    : { 
        stats: { noticias: 0, torneos: 0, torneosActivos: 0, seguidores: 0, crecimientoSeguidores: 0 },
        recentActivity: []
      }
    
  return (
    <ClubProvider initialClubs={clubs} initialSelectedClub={selectedClub}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard del Club</h2>
            <p className="text-muted-foreground">{selectedClub?.name || 'Cargando...'}</p>
          </div>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl md:text-2xl font-bold">{stats.noticias}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Torneos creados</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl md:text-2xl font-bold">{stats.torneos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl md:text-2xl font-bold">{stats.seguidores}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>
                Últimas acciones realizadas en el club
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'news' && <FileText className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'tournament' && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {activity.type === 'follower' && <Users className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="space-y-1 flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <Badge variant="outline" className="text-xs w-fit">
                            {activity.type === 'news' && 'Noticia publicada'}
                            {activity.type === 'tournament' && 'Torneo creado'}
                            {activity.type === 'follower' && 'Nuevo seguidor'}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        {activity.author && (
                          <p className="text-xs text-muted-foreground italic">
                            Por: {activity.author}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay actividad reciente en el club
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </div>
      </div>
    </ClubProvider>
  )
}

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

