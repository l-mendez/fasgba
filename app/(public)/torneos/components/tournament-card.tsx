import { Calendar, CalendarClock, CheckCircle2, ChevronRight, Clock, MapPin, PlayCircle, Ticket, Trophy, Users, type LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import {
  type TournamentDisplay,
  formatDateRange,
  getCostDisplay,
  getLocationDisplay,
  getPaceDisplay,
  getRoundsDisplay,
  getTimeDisplay,
  TOURNAMENT_STATUS_TEXT,
} from "@/lib/tournamentUtils"
import { TOURNAMENT_STATUS, type TournamentStatus } from "@/lib/utils/constants"

const STATUS_ICONS: Record<TournamentStatus, LucideIcon> = {
  upcoming: CalendarClock,
  ongoing: PlayCircle,
  past: CheckCircle2,
}

// Icon + text row used throughout the card body.
function InfoRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </li>
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
  const showLocation = torneo.location && torneo.location !== torneo.place

  // The title link stretches over the whole card; the registration link sits above it.
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-amber">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold leading-tight">
          <Link href={`/torneos/${torneo.id}`} className="text-terracotta after:absolute after:inset-0 group-hover:underline">
            {torneo.title}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <InfoPill icon={STATUS_ICONS[status]}>{TOURNAMENT_STATUS_TEXT[status]}</InfoPill>
          {isTeam && <InfoPill icon={Users}>Por Equipos</InfoPill>}
        </div>
        {torneo.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{torneo.description}</p>
        )}
      </div>

      <ul className="flex-1 space-y-1.5 text-sm text-muted-foreground">
        <InfoRow icon={Calendar}>{formatDateRange(torneo.start_date, torneo.end_date)}</InfoRow>
        {torneo.time && <InfoRow icon={Clock}>{getTimeDisplay(torneo.time)}</InfoRow>}
        <InfoRow icon={MapPin}>
          {torneo.place || getLocationDisplay(null, torneo.location)}
          {torneo.place && showLocation && <span className="block">{torneo.location}</span>}
        </InfoRow>
        <InfoRow icon={Trophy}>
          {getRoundsDisplay(torneo.rounds)} · {getPaceDisplay(torneo.pace)}
        </InfoRow>
        {showInscription && (torneo.inscription_details || torneo.cost) && (
          <InfoRow icon={Ticket}>
            {torneo.inscription_details && <span className="block">{torneo.inscription_details}</span>}
            {torneo.cost && <span className="block">{getCostDisplay(torneo.cost)}</span>}
          </InfoRow>
        )}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta">
          Ver torneo
          <ChevronRight className="h-4 w-4" />
        </span>
        {showRegistration && torneo.registration_link && (
          <Button asChild size="sm" className="relative z-10 bg-terracotta text-white hover:bg-terracotta/90">
            <a href={torneo.registration_link} target="_blank" rel="noopener noreferrer">
              Inscripción
            </a>
          </Button>
        )}
      </div>
    </article>
  )
}
