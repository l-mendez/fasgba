import Link from "next/link"
import type { ReactNode } from "react"
import {
  Award,
  Banknote,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  ListOrdered,
  MapPin,
  PlayCircle,
  Timer,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import {
  formatDateRange,
  getTournamentStatus,
  TOURNAMENT_STATUS_TEXT,
  type TournamentDisplay,
} from "@/lib/tournamentUtils"
import type { TournamentStatus } from "@/lib/utils/constants"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { type GameDisplay } from "@/lib/gameUtils-client"
import RoundsSection from "./rounds-section"

interface TeamPlayerDisplay {
  id: number
  full_name: string
  fide_id?: string
  rating?: number
}

interface RegisteredTeamDisplay {
  team_id: number
  name: string
  club_id?: number | null
  club_name: string
  players?: TeamPlayerDisplay[]
}

interface TournamentClientProps {
  tournament: TournamentDisplay
  initialGamesByRound: Record<number, GameDisplay[]>
  initialTotalRounds: number
  tournamentId: number
  registeredTeams?: RegisteredTeamDisplay[]
}

const STATUS_ICONS: Record<TournamentStatus, LucideIcon> = {
  upcoming: CalendarClock,
  ongoing: PlayCircle,
  past: CheckCircle2,
}

function InfoItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

export default function TournamentClient({
  tournament,
  initialGamesByRound,
  initialTotalRounds,
  tournamentId,
  registeredTeams = [],
}: TournamentClientProps) {
  const status = getTournamentStatus(tournament)
  const isTeam = tournament.tournament_type === "team"
  // Planned rounds, or the rounds actually created if there are more.
  const rounds = Math.max(tournament.rounds || 0, initialTotalRounds)
  const place = [...new Set([tournament.place, tournament.location].filter(Boolean))].join(", ")
  const showRegistration = status === "upcoming" && tournament.registration_link
  const hasInscription = Boolean(tournament.registration_deadline || tournament.inscription_details || showRegistration)
  const cardCount = 1 + Number(hasInscription) + Number(Boolean(tournament.prizes))
  const cardGrid =
    cardCount === 1 ? "max-w-md" : cardCount === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"

  return (
    <>
      <section className="w-full pt-8 md:pt-12">
        <div className="container space-y-3 px-4 md:px-6">
          <Link
            href="/torneos"
            className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Torneos
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{tournament.title}</h1>
          <div className="flex flex-wrap gap-1.5">
            <InfoPill icon={STATUS_ICONS[status]}>{TOURNAMENT_STATUS_TEXT[status]}</InfoPill>
            <InfoPill icon={isTeam ? Users : User}>{isTeam ? "Por equipos" : "Individual"}</InfoPill>
          </div>
          {tournament.description && (
            <p className="max-w-3xl whitespace-pre-line text-muted-foreground">{tournament.description}</p>
          )}
        </div>
      </section>

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl space-y-10">
            <div className={`grid grid-cols-1 gap-4 ${cardGrid}`}>
              <ul className="space-y-1.5 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <InfoItem icon={Calendar}>{formatDateRange(tournament.start_date, tournament.end_date)}</InfoItem>
                {tournament.time && <InfoItem icon={Clock}>{tournament.time}</InfoItem>}
                {place && <InfoItem icon={MapPin}>{place}</InfoItem>}
                {rounds > 0 && <InfoItem icon={ListOrdered}>{rounds} ronda{rounds !== 1 ? "s" : ""}</InfoItem>}
                {tournament.pace && <InfoItem icon={Timer}>{tournament.pace}</InfoItem>}
                {tournament.cost && <InfoItem icon={Banknote}>{tournament.cost}</InfoItem>}
                {isTeam && tournament.players_per_team && (
                  <InfoItem icon={Users}>
                    {tournament.players_per_team} jugadores por equipo
                    {tournament.max_teams ? ` · máx. ${tournament.max_teams} equipos` : ""}
                  </InfoItem>
                )}
              </ul>

              {hasInscription && (
                <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
                  <h2 className="font-semibold">Inscripción</h2>
                  {tournament.registration_deadline && (
                    <ul className="text-muted-foreground">
                      <InfoItem icon={CalendarClock}>
                        Hasta el {formatArgentinaDateOnly(tournament.registration_deadline)}
                      </InfoItem>
                    </ul>
                  )}
                  {tournament.inscription_details && (
                    <p className="whitespace-pre-line text-muted-foreground">{tournament.inscription_details}</p>
                  )}
                  {showRegistration && (
                    <Button asChild className="mt-auto bg-terracotta text-white hover:bg-terracotta/90">
                      <a href={tournament.registration_link!} target="_blank" rel="noopener noreferrer">
                        Inscribirse
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {tournament.prizes && (
                <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Award className="h-4 w-4 text-amber" />
                    Premios
                  </h2>
                  <p className="whitespace-pre-line text-muted-foreground">{tournament.prizes}</p>
                </div>
              )}
            </div>

            <RoundsSection
              totalRounds={initialTotalRounds}
              gamesByRound={initialGamesByRound}
              tournamentId={tournamentId}
              tournamentType={tournament.tournament_type || "individual"}
            />

            {isTeam && registeredTeams.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">
                  Equipos <span className="text-base font-medium text-muted-foreground">({registeredTeams.length})</span>
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {registeredTeams.map((team) => (
                    <div
                      key={team.team_id}
                      className={`relative flex h-full flex-col gap-3 rounded-lg border bg-card p-4 ${team.club_id ? "transition-colors hover:border-amber" : ""}`}
                    >
                      <div className="min-w-0">
                        {team.club_id ? (
                          <Link
                            href={`/clubes/${team.club_id}`}
                            className="block truncate font-semibold after:absolute after:inset-0 hover:underline"
                            title={team.name}
                          >
                            {team.name}
                          </Link>
                        ) : (
                          <p className="truncate font-semibold" title={team.name}>{team.name}</p>
                        )}
                        {team.club_name && team.club_name !== team.name && (
                          <p className="truncate text-sm text-muted-foreground" title={team.club_name}>{team.club_name}</p>
                        )}
                      </div>
                      {team.players && team.players.length > 0 && (
                        <ol className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
                          {team.players.map((player, idx) => (
                            <li key={player.id} className="flex items-center gap-2">
                              <span className="w-5 shrink-0 text-right tabular-nums">{idx + 1}.</span>
                              <span className="min-w-0 flex-1 truncate" title={player.full_name}>{player.full_name}</span>
                              {player.rating ? <span className="text-xs tabular-nums">{player.rating}</span> : null}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
