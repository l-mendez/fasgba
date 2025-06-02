"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, FileText, MessageSquare, Plus, Trophy, TrendingUp, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserAdminClubs, getClubFollowers, type Club } from "@/lib/clubUtils"
import { getCurrentUser } from "@/lib/userUtils"
import { supabase } from "@/lib/supabaseClient"

interface ClubStats {
  noticias: number
  torneos: number
  torneosActivos: number
  seguidores: number
  crecimientoSeguidores: number
}

interface RecentFollower {
  email: string
  created_at: string
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
  const [recentFollowers, setRecentFollowers] = useState<RecentFollower[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      // Get authentication token from Supabase
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

        // Fetch club statistics in parallel
        const [newsCountData, tournamentCountData, followersData] = await Promise.all([
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
          })
        ])

        // Calculate growth (followers who joined in the last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let recentFollowersCount = 0
        let recentFollowersList: RecentFollower[] = []

        if (followersData) {
          recentFollowersList = followersData.followers
            .filter(follower => new Date(follower.created_at) >= thirtyDaysAgo)
            .slice(0, 5) // Show only last 5 recent followers
            .map(follower => ({
              email: follower.email,
              created_at: follower.created_at
            }))
          
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

        setRecentFollowers(recentFollowersList)

      } catch (error) {
        console.error('Error fetching stats:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard del Club</h2>
          {adminClub && (
            <p className="text-muted-foreground">{adminClub.name}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/club-admin/noticias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva noticia
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.noticias}</div>
            <p className="text-xs text-muted-foreground">
              Total de noticias del club
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Torneos creados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.torneos}</div>
            <p className="text-xs text-muted-foreground">
              Total de torneos organizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.seguidores}</div>
            <p className="text-xs text-muted-foreground">
              +{recentFollowers.length} en los últimos 30 días
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `+${stats.crecimientoSeguidores}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Nuevos seguidores este mes
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimos seguidores del club
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ) : recentFollowers.length > 0 ? (
              <div className="space-y-8">
                {recentFollowers.map((follower, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Nuevo seguidor: {follower.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(follower.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay nuevos seguidores en los últimos 30 días
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
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

