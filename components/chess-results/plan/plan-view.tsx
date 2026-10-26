"use client"

import type { ReactNode } from "react"
import { AlertTriangle, ExternalLink, User, Users } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImportPlan } from "@/lib/chess-results/plan"
import type { CrDetails } from "@/lib/chess-results/types"
import { chessResultsUrl } from "@/lib/chess-results/url"
import { cn } from "@/lib/utils"
import { formatCrDateRange } from "../format"
import { PlanFields } from "./plan-fields"
import { PlanPlayers, PlanTeams } from "./plan-players"
import { PlanRounds } from "./plan-rounds"

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** One chip per non-zero count, in the order an admin cares about. */
function PlanSummary({ plan, isTeam }: { plan: ImportPlan; isTeam: boolean }) {
  const s = plan.summary
  const chips: Array<[number, string, "new" | "muted" | "warn"]> = [
    [s.newPlayers, plural(s.newPlayers, "jugador nuevo", "jugadores nuevos"), "new"],
    [isTeam ? s.newTeams : 0, plural(s.newTeams, "equipo nuevo", "equipos nuevos"), "new"],
    [s.newRounds, plural(s.newRounds, "ronda nueva", "rondas nuevas"), "new"],
    [s.newGames, plural(s.newGames, "partida nueva", "partidas nuevas"), "new"],
    [s.filledResults, plural(s.filledResults, "partida a completar", "partidas a completar"), "new"],
    [s.pgns, plural(s.pgns, "PGN", "PGN"), "new"],
    [s.existingPlayers, plural(s.existingPlayers, "jugador ya registrado", "jugadores ya registrados"), "muted"],
    [s.existingGames, plural(s.existingGames, "partida ya cargada", "partidas ya cargadas"), "muted"],
    [s.skippedGames, plural(s.skippedGames, "partida omitida", "partidas omitidas"), "warn"],
  ]
  const visible = chips.filter(([n]) => n > 0)
  const nothingNew = s.newPlayers + s.newTeams + s.newRounds + s.newGames + s.filledResults === 0
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1.5" aria-label="Resumen de la importación">
        {visible.map(([, label, tone]) => (
          <li
            key={label}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              tone === "new" && "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
              tone === "muted" && "bg-muted text-muted-foreground",
              tone === "warn" && "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {label}
          </li>
        ))}
      </ul>
      {nothingNew && <p className="text-sm text-muted-foreground">Ya está todo cargado; no hay partidas ni jugadores nuevos.</p>}
      {s.unmatchedTeams > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          {s.unmatchedTeams === 1 ? "Un equipo no coincide" : `${s.unmatchedTeams} equipos no coinciden`} con ningún club: sus partidas no se importan. Revisá la pestaña Equipos.
        </p>
      )}
    </div>
  )
}

/** chess-results name, link, type and dates in two compact lines. */
export function PlanHeading({ details }: { details: CrDetails }) {
  const meta = [details.isTeam ? "Por equipos" : "Individual", formatCrDateRange(details.startDate, details.endDate), details.place]
  return (
    <div className="min-w-0 space-y-0.5">
      <a
        href={chessResultsUrl(details.tnr)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-start gap-1 font-semibold text-terracotta underline-offset-4 hover:underline"
      >
        <span className="break-words">{details.name}</span>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
      </a>
      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
        {details.isTeam ? <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
        <span className="break-words">{meta.filter(Boolean).join(" · ")}</span>
      </p>
    </div>
  )
}

interface ImportPlanViewProps {
  plan: ImportPlan
  details: CrDetails
  /** Replaces the read-only "Torneo" tab (e.g. with the editable form on imports). */
  dataTab?: { label: string; content: ReactNode; invalid?: boolean }
  tab?: string
  onTabChange?: (tab: string) => void
}

/** Full, item-by-item preview of a chess-results import or sync. */
export function ImportPlanView({ plan, details, dataTab, tab, onTabChange }: ImportPlanViewProps) {
  const tabs = [
    { value: "datos", label: dataTab?.label ?? "Torneo", invalid: dataTab?.invalid },
    ...(details.isTeam ? [{ value: "equipos", label: `Equipos (${plan.teams.length})` }] : []),
    { value: "jugadores", label: `Jugadores (${plan.players.length})` },
    { value: "rondas", label: `Rondas (${plan.rounds.length})` },
  ]
  return (
    <div className="space-y-4">
      <PlanHeading details={details} />
      <PlanSummary plan={plan} isTeam={details.isTeam} />
      <Tabs value={tab} defaultValue={tab ? undefined : "datos"} onValueChange={onTabChange}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full justify-start">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className={cn(t.invalid && "text-destructive")}>
                {t.label}{t.invalid && " •"}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="datos" className="mt-4">{dataTab?.content ?? <PlanFields fields={plan.fields} details={details} />}</TabsContent>
        {details.isTeam && <TabsContent value="equipos" className="mt-4"><PlanTeams teams={plan.teams} /></TabsContent>}
        <TabsContent value="jugadores" className="mt-4"><PlanPlayers players={plan.players} /></TabsContent>
        <TabsContent value="rondas" className="mt-4"><PlanRounds rounds={plan.rounds} /></TabsContent>
      </Tabs>
    </div>
  )
}
