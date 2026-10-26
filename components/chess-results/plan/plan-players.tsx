"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { normalizeForSearch } from "@/lib/countries"
import type { PlanPlayer, PlanTeam } from "@/lib/chess-results/plan"
import { cn } from "@/lib/utils"
import { PlanStatusBadge } from "./plan-status"
import { PlayerAssignRow, TeamAssignRow, type AssignProps } from "../assign/assign-rows"

type Filter = "all" | "new" | "existing"
const FILTERS: Array<[Filter, string]> = [["all", "Todos"], ["new", "Nuevos"], ["existing", "Existentes"]]

const TEAM_STATUS = {
  enrolled: (t: PlanTeam) => ({ status: "exists" as const, label: "Inscripto", detail: siteName(t) }),
  existing: (t: PlanTeam) => ({ status: "new" as const, label: "Se inscribe", detail: siteName(t) }),
  new: (t: PlanTeam) => ({ status: "new" as const, label: "Equipo nuevo", detail: t.decision.kind === "new" ? `Club: ${"id" in t.decision.club ? t.decision.club.name : t.decision.club.newName}` : null }),
  unmatched: () => ({ status: "skip" as const, label: "Sin asignar", detail: "Sus partidas no se importan." }),
}
const siteNameOf = (p: PlanPlayer) => (p.decision.kind === "existing" ? p.decision.siteName : null)

// Only mention the site's name when it really differs (not just accents/case).
const differs = (a: string, b: string | null) => !!b && normalizeForSearch(a) !== normalizeForSearch(b)

function siteName(t: PlanTeam) {
  return "siteName" in t.decision && differs(t.name, t.decision.siteName) ? `En el sitio: ${t.decision.siteName}` : null
}

export function PlanTeams({ teams, assign }: { teams: PlanTeam[]; assign?: AssignProps }) {
  if (assign) {
    return <ul className="divide-y">{teams.map((team) => <TeamAssignRow key={team.key} team={team} assign={assign} />)}</ul>
  }
  return (
    <ul className="divide-y">
      {teams.map((team) => {
        const s = TEAM_STATUS[team.decision.kind](team)
        return (
          <li key={team.name} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 flex-1 break-words">
              <span className="font-medium">{team.name}</span>
              <span className="block text-xs text-muted-foreground">
                {team.players} jugadores{s.detail ? ` · ${s.detail}` : ""}
              </span>
            </span>
            <PlanStatusBadge status={s.status} label={s.label} />
          </li>
        )
      })}
    </ul>
  )
}

/** Searchable player list showing which players are created and which already exist. */
export function PlanPlayers({ players, assign }: { players: PlanPlayer[]; assign?: AssignProps }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const visible = useMemo(() => {
    const q = normalizeForSearch(query.trim())
    return players.filter((p) =>
      (filter === "all" || (filter === "new") === (p.decision.kind === "new")) &&
      (!q || normalizeForSearch([p.name, p.fideId, p.club, p.team, siteNameOf(p)].filter(Boolean).join(" ")).includes(q)))
  }, [players, query, filter])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, FIDE, club o equipo" className="pl-8" />
        </div>
        <div className="flex gap-1" role="group" aria-label="Filtrar jugadores">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium", filter === value ? "border-amber bg-amber/10" : "text-muted-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y">
        {visible.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sin resultados.</li>}
        {assign && visible.map((p) => <PlayerAssignRow key={p.key} player={p} assign={assign} />)}
        {!assign && visible.map((p) => (
          <li key={p.key} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 flex-1 break-words">
              <span className="font-medium">{p.title && <span className="mr-1 text-xs text-terracotta">{p.title}</span>}{p.name}</span>
              <span className="block text-xs text-muted-foreground">
                {[p.rating ? `Elo ${p.rating}` : null, p.fideId ? `FIDE ${p.fideId}` : null, p.team ?? p.club].filter(Boolean).join(" · ")}
                {differs(p.name, siteNameOf(p)) && ` · En el sitio: ${siteNameOf(p)}`}
              </span>
            </span>
            <PlanStatusBadge status={p.decision.kind === "existing" ? "exists" : "new"} label={p.decision.kind === "existing" ? "Existente" : "Jugador nuevo"} />
          </li>
        ))}
      </ul>
    </div>
  )
}
