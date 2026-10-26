"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { normalizeForSearch } from "@/lib/countries"
import type { PlanPlayer, PlanTeam } from "@/lib/chess-results/plan"
import { cn } from "@/lib/utils"
import { PlanStatusBadge } from "./plan-status"

type Filter = "all" | "new" | "existing"
const FILTERS: Array<[Filter, string]> = [["all", "Todos"], ["new", "Nuevos"], ["existing", "Existentes"]]

const TEAM_STATUS = {
  enrolled: (t: PlanTeam) => ({ status: "exists" as const, label: "Inscripto", detail: siteName(t) }),
  existing: (t: PlanTeam) => ({ status: "new" as const, label: "Se inscribe", detail: siteName(t) }),
  new: (t: PlanTeam) => ({ status: "new" as const, label: "Equipo nuevo", detail: t.match.kind === "new" ? `Club: ${t.match.club.name}` : null }),
  unmatched: () => ({ status: "skip" as const, label: "Sin club", detail: "Sus partidas no se importan; crealo a mano." }),
}
// Only mention the site's name when it really differs (not just accents/case).
const differs = (a: string, b: string | null) => !!b && normalizeForSearch(a) !== normalizeForSearch(b)

function siteName(t: PlanTeam) {
  return "siteName" in t.match && differs(t.name, t.match.siteName) ? `En el sitio: ${t.match.siteName}` : null
}

export function PlanTeams({ teams }: { teams: PlanTeam[] }) {
  return (
    <ul className="divide-y">
      {teams.map((team) => {
        const s = TEAM_STATUS[team.match.kind](team)
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
export function PlanPlayers({ players }: { players: PlanPlayer[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const visible = useMemo(() => {
    const q = normalizeForSearch(query.trim())
    return players.filter((p) =>
      (filter === "all" || (filter === "new") === !p.siteName) &&
      (!q || normalizeForSearch([p.name, p.fideId, p.club, p.team, p.siteName].filter(Boolean).join(" ")).includes(q)))
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
        {visible.map((p) => (
          <li key={`${p.team}:${p.name}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 flex-1 break-words">
              <span className="font-medium">{p.title && <span className="mr-1 text-xs text-terracotta">{p.title}</span>}{p.name}</span>
              <span className="block text-xs text-muted-foreground">
                {[p.rating ? `Elo ${p.rating}` : null, p.fideId ? `FIDE ${p.fideId}` : null, p.team ?? p.club].filter(Boolean).join(" · ")}
                {differs(p.name, p.siteName) && ` · En el sitio: ${p.siteName}`}
              </span>
            </span>
            <PlanStatusBadge status={p.siteName ? "exists" : "new"} label={p.siteName ? "Existente" : "Jugador nuevo"} />
          </li>
        ))}
      </ul>
    </div>
  )
}
