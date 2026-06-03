import { Calendar, Clock, ExternalLink, MapPin, Trophy, Users, type LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  type TournamentDisplay,
  formatDateRange,
  getCostDisplay,
  getLocationDisplay,
  getPaceDisplay,
  getRoundsDisplay,
  getTimeDisplay,
  getTournamentStatusText,
} from "@/lib/tournamentUtils"
import { TOURNAMENT_STATUS, type TournamentStatus } from "@/lib/utils/constants"

const STATUS_BADGE_STYLES: Record<TournamentStatus, string> = {
  upcoming: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
  ongoing: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
  past: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
}

// A labelled row with an amber icon, used throughout the card body.
function InfoRow({
  icon: Icon,
  align = "center",
  children,
}: {
  icon: LucideIcon
  align?: "center" | "start"
  children: ReactNode
}) {
  return (
    <div className={cn("flex gap-2", align === "start" ? "items-start" : "items-center")}>
      <Icon className={cn("h-4 w-4 text-amber", align === "start" && "shrink-0 mt-0.5")} />
      {children}
    </div>
  )
}

export function TournamentCard({
  torneo,
  status,
}: {
  torneo: TournamentDisplay
  status: TournamentStatus
}) {
  const isTeam = torneo.tournament_type === "team"
  // Inscription details show while a tournament is still relevant (upcoming or ongoing);
  // the registration button only makes sense before it starts.
  const showInscription = status !== TOURNAMENT_STATUS.PAST
  const showRegistration = status === TOURNAMENT_STATUS.UPCOMING

  return (
    <Card className="border-amber/20 shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3 border-b border-amber/10">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-terracotta">{torneo.title}</CardTitle>
          {isTeam && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
              <Users className="h-3 w-3 mr-1" />
              Por Equipos
            </Badge>
          )}
        </div>
        <CardDescription>{torneo.description || "Información del torneo próximamente"}</CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-4">
          <InfoRow icon={Calendar}>
            <span className="text-sm">{formatDateRange(torneo.start_date, torneo.end_date)}</span>
          </InfoRow>

          <InfoRow icon={Clock}>
            <span className="text-sm">{getTimeDisplay(torneo.time)}</span>
          </InfoRow>

          <InfoRow icon={MapPin} align="start">
            <div className="min-w-0 flex-1">
              {torneo.place && (
                <span className="text-sm block text-amber-dark break-words">{torneo.place}</span>
              )}
              <span className="text-sm text-muted-foreground break-words">
                {getLocationDisplay(torneo.place, torneo.location)}
              </span>
            </div>
          </InfoRow>

          <InfoRow icon={Trophy}>
            <span className="text-sm">
              {getRoundsDisplay(torneo.rounds)} - {getPaceDisplay(torneo.pace)}
            </span>
          </InfoRow>

          {showInscription && (
            <InfoRow icon={Users} align="start">
              <div className="min-w-0 flex-1">
                <span className="text-sm block break-words">
                  {torneo.inscription_details || "Información de inscripción próximamente"}
                </span>
                <span className="text-sm text-muted-foreground break-words">
                  Costo: {getCostDisplay(torneo.cost)}
                </span>
              </div>
            </InfoRow>
          )}

          <InfoRow icon={Trophy}>
            <span className={cn("text-sm font-medium px-2 py-1 rounded-full", STATUS_BADGE_STYLES[status])}>
              {getTournamentStatusText(torneo)}
            </span>
          </InfoRow>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="flex-1 border-terracotta text-terracotta hover:bg-terracotta/10">
          <Link href={`/torneos/${torneo.id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Torneo
          </Link>
        </Button>
        {showRegistration && torneo.registration_link && (
          <Button asChild className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white">
            <a href={torneo.registration_link} target="_blank" rel="noopener noreferrer">
              Inscripción
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
