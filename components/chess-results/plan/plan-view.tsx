"use client"

import { AlertTriangle } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImportPlan } from "@/lib/chess-results/plan"
import type { CrDetails } from "@/lib/chess-results/types"
import { PlanFields } from "./plan-fields"
import { PlanPlayers, PlanTeams } from "./plan-players"
import { PlanRounds } from "./plan-rounds"

function Stat({ label, value, tone }: { label: string; value: number; tone?: "new" | "warn" }) {
  return (
    <div className="rounded-md border px-2 py-1.5 text-center">
      <div className={tone === "new" ? "font-semibold tabular-nums text-emerald-700 dark:text-emerald-400" : tone === "warn" ? "font-semibold tabular-nums text-destructive" : "font-semibold tabular-nums"}>
        {value}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  )
}

/** Full, item-by-item preview of a chess-results import or sync. */
export function ImportPlanView({ plan, details }: { plan: ImportPlan; details: CrDetails }) {
  const s = plan.summary
  const nothingToDo = s.newPlayers + s.newTeams + s.newRounds + s.newGames + s.filledResults === 0
  const stats = [
    { label: "Jugadores nuevos", value: s.newPlayers, tone: "new" as const },
    { label: "Jugadores existentes", value: s.existingPlayers },
    ...(details.isTeam ? [{ label: "Equipos nuevos", value: s.newTeams, tone: "new" as const }] : []),
    { label: "Rondas nuevas", value: s.newRounds, tone: "new" as const },
    { label: "Partidas nuevas", value: s.newGames, tone: "new" as const },
    { label: "A completar (resultado/PGN)", value: s.filledResults, tone: "new" as const },
    { label: "PGN a importar", value: s.pgns, tone: "new" as const },
    { label: "Ya cargadas", value: s.existingGames },
    ...(s.skippedGames ? [{ label: "Partidas omitidas", value: s.skippedGames, tone: "warn" as const }] : []),
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
      </div>
      {s.unmatchedTeams > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          {s.unmatchedTeams === 1 ? "Un equipo no coincide" : `${s.unmatchedTeams} equipos no coinciden`} con ningún club: sus partidas no se importan.
        </p>
      )}
      {nothingToDo && <p className="text-sm text-muted-foreground">Ya está todo cargado; no hay nada nuevo para importar.</p>}

      <Tabs defaultValue="torneo">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="torneo">Torneo</TabsTrigger>
          {details.isTeam && <TabsTrigger value="equipos">Equipos ({plan.teams.length})</TabsTrigger>}
          <TabsTrigger value="jugadores">Jugadores ({plan.players.length})</TabsTrigger>
          <TabsTrigger value="rondas">Rondas ({plan.rounds.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="torneo"><PlanFields fields={plan.fields} details={details} /></TabsContent>
        {details.isTeam && <TabsContent value="equipos"><PlanTeams teams={plan.teams} /></TabsContent>}
        <TabsContent value="jugadores"><PlanPlayers players={plan.players} /></TabsContent>
        <TabsContent value="rondas"><PlanRounds rounds={plan.rounds} /></TabsContent>
      </Tabs>
    </div>
  )
}
