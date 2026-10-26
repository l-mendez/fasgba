"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { chessResultsUrl, parseChessResultsTnr } from "@/lib/chess-results/url"
import type { ChessResultsSyncResponse } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import type { Assignments } from "@/lib/chess-results/assign"
import { ChessResultsSyncDialog } from "./chess-results-sync-dialog"
import { toastSyncReport } from "./format"

interface ChessResultsLinkFieldProps {
  value: string
  error?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** When editing an existing tournament, enables linking + syncing right away. */
  tournamentId?: number | string
}

/** "Link de chess-results" form input, with a sync action on existing tournaments. */
export function ChessResultsLinkField({ value, error, onChange, tournamentId }: ChessResultsLinkFieldProps) {
  const router = useRouter()
  const [reviewing, setReviewing] = useState<number | null>(null)
  const tnr = parseChessResultsTnr(value)

  const sync = async (assignments: Assignments) => {
    try {
      const result: ChessResultsSyncResponse = await apiCall(`/api/tournaments/${tournamentId}/chess-results`, {
        method: "POST",
        body: JSON.stringify({ url: tnr, assignments }),
      })
      // Rounds/teams tabs keep their own state, so offer a reload to see new data.
      const reload = result.report.changed ? { label: "Recargar", onClick: () => window.location.reload() } : undefined
      toastSyncReport("Sincronizado con chess-results", result.report, reload)
      router.refresh()
    } catch (err) {
      toast.error("No se pudo sincronizar", { description: err instanceof Error ? err.message : undefined })
      throw err
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="chess_results_link">Link de chess-results</Label>
      <div className="flex gap-2">
        <Input
          id="chess_results_link"
          name="chess_results_link"
          value={value}
          onChange={onChange}
          placeholder="https://chess-results.com/tnr123456.aspx"
          className={error ? "border-destructive" : ""}
        />
        {tnr && (
          <Button type="button" variant="outline" size="icon" asChild>
            <a href={chessResultsUrl(tnr)} target="_blank" rel="noopener noreferrer" aria-label="Abrir en chess-results" title="Abrir en chess-results">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {tournamentId != null && (
          <Button type="button" variant="outline" onClick={() => setReviewing(tnr)} disabled={!tnr} className="shrink-0" title="Revisar e importar jugadores, rondas y resultados faltantes">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="sr-only sm:not-sr-only">Sincronizar</span>
          </Button>
        )}
      </div>
      {tournamentId != null && (
        <ChessResultsSyncDialog
          tnr={reviewing}
          tournamentId={Number(tournamentId)}
          onOpenChange={(open) => !open && setReviewing(null)}
          onConfirm={sync}
        />
      )}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Opcional. {tournamentId != null
            ? "Sincronizar muestra todo lo que falta (jugadores, rondas y resultados) y lo importa al confirmar."
            : "Pegá el link o el número del torneo."}
        </p>
      )}
    </div>
  )
}
