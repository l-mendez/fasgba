"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, FileText, MessageSquare, Plus, Trophy, TrendingUp, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserAdminClubs, getClubFollowers, type Club } from "@/lib/clubUtils"
import { getCurrentUser } from "@/lib/userUtils"
import { createClient } from "@/lib/supabase/client"

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

export default function ClubAdminDashboard() {
  const [stats, setStats] = useState<ClubStats>({
    noticias: 0,
    torneos: 0,
    torneosActivos: 0,
    seguidores: 0,
    crecimientoSeguidores: 0,
  })
  const [adminClub, setAdminClub] = useState<Club | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      // Get authentication token from Supabase
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      const apiResponse = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      })

      if (!apiResponse.ok) {
        throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`)
      }

      return apiResponse.json()
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const user = await getCurrentUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Get clubs the user administers
        const adminClubs = await getUserAdminClubs(user.id)
        if (adminClubs.length === 0) {
          setError('No tienes clubes asignados como administrador')
          return
        }

        // Use the first club the user administers
        const club = adminClubs[0]
        setAdminClub(club)

        // Fetch club statistics and recent data in parallel
        const [newsCountData, tournamentCountData, followersData, recentNewsData, recentTournamentsData] = await Promise.all([
          apiCall(`/api/clubs/${club.id}/news/count`).catch(() => ({ count: 0 })),
          apiCall(`/api/clubs/${club.id}/tournaments/count`).catch(() => ({ count: 0 })),
          getClubFollowers(club.id).catch(async () => {
            // Fallback: just get the count without detailed follower info
            try {
              const countData = await apiCall(`/api/clubs/${club.id}/followers/count`)
              return {
                club: { id: club.id, name: club.name },
                followers: [],
                count: countData.count
              }
            } catch {
              return { club: { id: club.id, name: club.name }, followers: [], count: 0 }
            }
          }),
          // Get recent news (limit 5)
          apiCall(`/api/clubs/${club.id}/news?limit=5`).catch(() => []),
          // Get recent tournaments (limit 5)
          apiCall(`/api/clubs/${club.id}/tournaments?limit=5`).catch(() => ({ tournaments: [] }))
        ])

        // Calculate growth (followers who joined in the last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let recentFollowersCount = 0

        if (followersData) {
          recentFollowersCount = followersData.followers
            .filter(follower => new Date(follower.created_at) >= thirtyDaysAgo).length
        }

        // Calculate growth percentage (assuming we had some baseline)
        const totalFollowers = followersData?.count || 0
        const growthPercentage = totalFollowers > 0 
          ? Math.round((recentFollowersCount / totalFollowers) * 100)
          : 0

        setStats({
          noticias: newsCountData.count,
          torneos: tournamentCountData.count,
          torneosActivos: 0, // We'll need to implement this with tournament status
          seguidores: totalFollowers,
          crecimientoSeguidores: growthPercentage,
        })

        // Create unified activity feed
        const activities: ActivityItem[] = []

        // Add recent news
        if (recentNewsData && Array.isArray(recentNewsData)) {
          recentNewsData.slice(0, 3).forEach((news: any) => {
            activities.push({
              type: 'news',
              title: news.title,
              date: news.date || news.created_at,
              description: news.extract,
              author: news.author_email || 'Autor desconocido'
            })
          })
        }

        // Add recent tournaments
        if (recentTournamentsData?.tournaments) {
          recentTournamentsData.tournaments.slice(0, 3).forEach((tournament: any) => {
            const tournamentDate = tournament.tournament_dates?.[0]?.event_date || new Date().toISOString()
            activities.push({
              type: 'tournament',
              title: tournament.title,
              date: tournamentDate,
              description: tournament.description
            })
          })
        }

        // Add recent followers (note: user_follows_club table doesn't track created_at)
        // We'll skip adding followers to recent activity since we can't determine when they followed
        // if (followersData?.followers) {
        //   followersData.followers
        //     .filter(follower => new Date(follower.created_at) >= thirtyDaysAgo)
        //     .slice(0, 3)
        //     .forEach((follower: any) => {
        //       activities.push({
        //         type: 'follower',
        //         title: `Nuevo seguidor: ${follower.email}`,
        //         date: follower.created_at
        //       })
        //     })
        // }

        // Sort activities by date (most recent first)
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Keep only the 5 most recent activities
        setRecentActivity(activities.slice(0, 5))

      } catch (error) {
        console.error('Error fetching stats:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'news':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'tournament':
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'follower':
        return <Users className="h-4 w-4 text-green-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'news':
        return 'Noticia publicada'
      case 'tournament':
        return 'Torneo creado'
      case 'follower':
        return 'Nuevo seguidor'
      default:
        return 'Actividad'
    }
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard del Club</h2>
          {adminClub && (
            <p className="text-muted-foreground">{adminClub.name}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/club-admin/noticias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva noticia
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">{loading ? '...' : stats.noticias}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Torneos creados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">{loading ? '...' : stats.torneos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">{loading ? '...' : stats.seguidores}</div>
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
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="space-y-1 flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <Badge variant="outline" className="text-xs w-fit">
                          {getActivityTypeLabel(activity.type)}
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
            <div className="grid gap-3 md:gap-4">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/club-admin/noticias/nueva">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva noticia
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/club-admin/torneos/nuevo">
                  <Trophy className="mr-2 h-4 w-4" />
                  Nuevo torneo
                </Link>
              </Button>
              {adminClub && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/clubes/${adminClub.id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    Ver página del club
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

