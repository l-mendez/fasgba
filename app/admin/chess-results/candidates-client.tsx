"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChessResultsImportDialog } from "@/components/chess-results/chess-results-import-dialog"
import { normalizeForSearch } from "@/lib/countries"
import { apiCall } from "@/lib/utils/apiClient"
import { CandidateRow } from "./candidate-row"
import { LinkCandidateDialog } from "./link-candidate-dialog"
import type { CandidateItem, CandidateStatus, TournamentOption } from "./types"

const TABS: Array<{ value: CandidateStatus; label: string; empty: string }> = [
  { value: "pending", label: "Pendientes", empty: "No hay torneos pendientes de revisión. Usá «Buscar ahora» para revisar chess-results." },
  { value: "ignored", label: "Ignorados", empty: "No hay torneos ignorados." },
  { value: "imported", label: "Importados", empty: "Todavía no se importó ningún torneo detectado." },
]

interface CandidatesClientProps {
  candidates: CandidateItem[]
  tournaments: TournamentOption[]
}

export function CandidatesClient({ candidates, tournaments }: CandidatesClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<CandidateStatus>("pending")
  const [query, setQuery] = useState("")
  const [importing, setImporting] = useState<CandidateItem | null>(null)
  const [linking, setLinking] = useState<CandidateItem | null>(null)
  const [busyTnr, setBusyTnr] = useState<number | null>(null)

  const visible = useMemo(() => {
    const q = normalizeForSearch(query.trim())
    return candidates.filter((c) => c.status === status && (!q ||
      [c.name, c.organizer, c.place, String(c.tnr)].some((v) => v && normalizeForSearch(v).includes(q))))
  }, [candidates, status, query])

  const setCandidateStatus = async (candidate: CandidateItem, next: "pending" | "ignored") => {
    setBusyTnr(candidate.tnr)
    try {
      await apiCall(`/api/admin/chess-results/candidates/${candidate.tnr}`, { method: "PATCH", body: JSON.stringify({ status: next }) })
      toast.success(next === "ignored" ? "Torneo ignorado" : "Torneo restaurado", {
        description: candidate.name,
        action: { label: "Deshacer", onClick: () => void setCandidateStatus(candidate, next === "ignored" ? "pending" : "ignored") },
      })
      router.refresh()
    } catch (err) {
      toast.error("No se pudo actualizar", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusyTnr(null)
    }
  }

  const current = TABS.find((t) => t.value === status)!

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={status} onValueChange={(v) => setStatus(v as CandidateStatus)}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label} ({candidates.filter((c) => c.status === tab.value).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, organizador o lugar" className="pl-8" />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {query ? "Ningún torneo coincide con la búsqueda." : current.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((candidate) => (
            <CandidateRow
              key={candidate.tnr}
              candidate={candidate}
              busy={busyTnr === candidate.tnr}
              onImport={() => setImporting(candidate)}
              onLink={() => setLinking(candidate)}
              onIgnore={() => setCandidateStatus(candidate, "ignored")}
              onRestore={() => setCandidateStatus(candidate, "pending")}
            />
          ))}
        </ul>
      )}

      <ChessResultsImportDialog
        open={!!importing}
        onOpenChange={(open) => !open && setImporting(null)}
        initialUrl={importing ? String(importing.tnr) : undefined}
        suggestion={importing?.suggested ?? null}
        onLinkInstead={() => {
          setLinking(importing)
          setImporting(null)
        }}
        chooseClub
        onImported={() => router.refresh()}
      />
      <LinkCandidateDialog
        candidate={linking}
        tournaments={tournaments}
        onOpenChange={(open) => !open && setLinking(null)}
        onLinked={() => router.refresh()}
      />
    </div>
  )
}
