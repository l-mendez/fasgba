"use client"

import { useEffect, useState } from "react"
import { FileText, Trophy, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClubContext } from "../context/club-context"
import { QuickActions } from "./quick-actions"
import { apiCall } from "../context/club-context"

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

export function DashboardContent() {
  const { selectedClub } = useClubContext()
  const [stats, setStats] = useState<ClubStats>({
    noticias: 0,
    torneos: 0,
    torneosActivos: 0,
    seguidores: 0,
    crecimientoSeguidores: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch club statistics
  const fetchClubStats = async (clubId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await apiCall(`/clubs/${clubId}/stats`)
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
    } catch (err) {
      console.error('Error fetching club stats:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      // Set default values on error
      setStats({
        noticias: 0,
        torneos: 0,
        torneosActivos: 0,
        seguidores: 0,
        crecimientoSeguidores: 0,
      })
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load stats when selected club changes
  useEffect(() => {
    if (selectedClub) {
      fetchClubStats(selectedClub.id)
    }
  }, [selectedClub])

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecciona un club para ver el dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard del Club</h2>
          <p className="text-muted-foreground">{selectedClub.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {isLoading ? "..." : stats.noticias}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Torneos creados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {isLoading ? "..." : stats.torneos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {isLoading ? "..." : stats.seguidores}
            </div>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Cargando actividad...</p>
              </div>
            ) : recentActivity.length > 0 ? (
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
            <QuickActions selectedClub={selectedClub} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 