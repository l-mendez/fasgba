"use client"

import { useMemo, useState } from "react"
import { Check, Link2, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toastSyncReport } from "@/components/chess-results/format"
import { normalizeForSearch } from "@/lib/countries"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import type { ChessResultsSyncResponse } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { cn } from "@/lib/utils"
import type { CandidateItem, TournamentOption } from "./types"

const MAX_OPTIONS = 50
const dayDistance = (a: string | null, b: string | null) =>
  a && b ? Math.abs(new Date(a).getTime() - new Date(b).getTime()) : Number.POSITIVE_INFINITY

interface LinkCandidateDialogProps {
  candidate: CandidateItem | null
  tournaments: TournamentOption[]
  onOpenChange: (open: boolean) => void
  onLinked: () => void
}

/** Pick an existing site tournament for a discovered chess-results tournament. */
export function LinkCandidateDialog(props: LinkCandidateDialogProps) {
  return (
    <Dialog open={!!props.candidate} onOpenChange={props.onOpenChange}>
      {props.candidate && <LinkCandidateContent key={props.candidate.tnr} {...props} candidate={props.candidate} />}
    </Dialog>
  )
}

function LinkCandidateContent({ candidate, tournaments, onOpenChange, onLinked }: LinkCandidateDialogProps & { candidate: CandidateItem }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<number | null>(candidate.suggested?.id ?? null)
  const [saving, setSaving] = useState(false)

  // Suggested first, then by title match, then the tournaments closest in date.
  const options = useMemo(() => {
    const q = normalizeForSearch(query.trim())
    return tournaments
      .filter((t) => !q || normalizeForSearch(t.title).includes(q) || String(t.id) === q)
      .sort((a, b) =>
        Number(b.id === candidate.suggested?.id) - Number(a.id === candidate.suggested?.id) ||
        dayDistance(a.startDate, candidate.start_date) - dayDistance(b.startDate, candidate.start_date))
      .slice(0, MAX_OPTIONS)
  }, [candidate, tournaments, query])

  const link = async () => {
    if (selected == null) return
    setSaving(true)
    try {
      const result: ChessResultsSyncResponse = await apiCall(`/api/admin/chess-results/candidates/${candidate.tnr}/link`, {
        method: "POST",
        body: JSON.stringify({ tournamentId: selected }),
      })
      toastSyncReport("Torneo vinculado", result.report)
      onOpenChange(false)
      onLinked()
    } catch (err) {
      toast.error("No se pudo vincular", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent
      className="flex max-h-[90vh] flex-col sm:max-w-lg"
      onEscapeKeyDown={(e) => saving && e.preventDefault()}
      onInteractOutside={(e) => saving && e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Vincular a un torneo existente</DialogTitle>
        <DialogDescription className="break-words">
          {candidate.name}. Se importarán los jugadores, rondas y resultados que falten.
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar torneo por título" className="pl-8" autoFocus />
      </div>

      <ul className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" role="listbox" aria-label="Torneos">
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
                onClick={() => setSelected(t.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected ? "border-amber bg-accent" : "border-transparent",
                )}
              >
                <Check className={cn("h-4 w-4 shrink-0 text-terracotta", !isSelected && "invisible")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.title}</span>
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

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={link} disabled={selected == null || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
          {saving ? "Vinculando…" : "Vincular"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
