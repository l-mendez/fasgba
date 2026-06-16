import { FileText, Trophy, Users } from "lucide-react"

import { ErrorAlert } from "@/components/error-alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ClubAdminActivityItem,
  ClubAdminClub,
  ClubAdminStats,
} from "@/lib/club-admin/types"
import { QuickActions } from "./quick-actions"

interface DashboardOverviewProps {
  error?: string | null
  isLoading?: boolean
  recentActivity: ClubAdminActivityItem[]
  selectedClub: ClubAdminClub
  stats: ClubAdminStats
}

export function DashboardOverview({
  error,
  isLoading = false,
  recentActivity,
  selectedClub,
  stats,
}: DashboardOverviewProps) {
  return (
    <>
      {error ? <ErrorAlert message={error} /> : null}

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
                      {activity.type === "news" && <FileText className="h-4 w-4 text-blue-500" />}
                      {activity.type === "tournament" && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {activity.type === "follower" && <Users className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="space-y-1 flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <Badge variant="outline" className="text-xs w-fit">
                          {activity.type === "news" && "Noticia publicada"}
                          {activity.type === "tournament" && "Torneo creado"}
                          {activity.type === "follower" && "Nuevo seguidor"}
                        </Badge>
                      </div>
                      {activity.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      ) : null}
                      {activity.author ? (
                        <p className="text-xs text-muted-foreground italic">
                          Por: {activity.author}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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
    </>
  )
}
