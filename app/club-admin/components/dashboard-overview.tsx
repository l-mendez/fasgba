import { FileText, Trophy, Users } from "lucide-react"

import { ErrorAlert } from "@/components/error-alert"
import { InfoPill } from "@/components/info-pill"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <FileText className="h-4 w-4 text-amber" />
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
            <Trophy className="h-4 w-4 text-amber" />
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
            <Users className="h-4 w-4 text-amber" />
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
            <CardTitle className="text-terracotta">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Cargando actividad...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      {activity.type === "news" && <InfoPill icon={FileText}>Noticia</InfoPill>}
                      {activity.type === "tournament" && <InfoPill icon={Trophy}>Torneo</InfoPill>}
                      {activity.type === "follower" && <InfoPill icon={Users}>Seguidor</InfoPill>}
                    </div>
                    {activity.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
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
                      {activity.author ? ` · ${activity.author}` : null}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin actividad reciente.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-terracotta">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions selectedClub={selectedClub} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
