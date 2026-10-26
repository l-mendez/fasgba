"use client"

import { useMemo, useState } from "react"
import { Check, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { normalizeForSearch } from "@/lib/countries"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { cn } from "@/lib/utils"
import type { CandidateItem, TournamentOption } from "./types"

const MAX_OPTIONS = 50
const dayDistance = (a: string | null, b: string | null) =>
  a && b ? Math.abs(new Date(a).getTime() - new Date(b).getTime()) : Number.POSITIVE_INFINITY

interface TournamentPickerProps {
  candidate: CandidateItem
  tournaments: TournamentOption[]
  selected: number | null
  onSelect: (id: number) => void
}

/** Searchable list of site tournaments: suggested first, then the closest in date. */
export function TournamentPicker({ candidate, tournaments, selected, onSelect }: TournamentPickerProps) {
  const [query, setQuery] = useState("")
  const options = useMemo(() => {
    const q = normalizeForSearch(query.trim())
    return tournaments
      .filter((t) => !q || normalizeForSearch(t.title).includes(q) || String(t.id) === q)
      .sort((a, b) =>
        Number(b.id === candidate.suggested?.id) - Number(a.id === candidate.suggested?.id) ||
        dayDistance(a.startDate, candidate.start_date) - dayDistance(b.startDate, candidate.start_date))
      .slice(0, MAX_OPTIONS)
  }, [candidate, tournaments, query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar torneo por título" className="pl-8" />
      </div>
      <ul className="space-y-1" role="listbox" aria-label="Torneos del sitio">
        {options.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sin resultados.</li>}
        {options.map((t) => {
          const linkedElsewhere = t.tnr != null && t.tnr !== candidate.tnr
          const isSelected = selected === t.id
          return (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={linkedElsewhere}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected ? "border-amber bg-accent" : "border-transparent",
                )}
              >
                <Check className={cn("h-4 w-4 shrink-0 text-terracotta", !isSelected && "invisible")} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.startDate ? formatArgentinaDateOnly(t.startDate) : "Sin fecha"}
                    {t.id === candidate.suggested?.id && " · Sugerido"}
                    {linkedElsewhere && " · Ya vinculado a otro torneo de chess-results"}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
