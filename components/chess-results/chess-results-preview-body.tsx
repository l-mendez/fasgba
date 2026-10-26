"use client"

import { useEffect, useState } from "react"
import { Info, Loader2 } from "lucide-react"

import { ErrorAlert } from "@/components/error-alert"
import type { ChessResultsPreview } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { ChessResultsPreviewCard } from "./chess-results-preview-card"
import { ImportPlanView } from "./plan/plan-view"

export interface PreviewState {
  preview: ChessResultsPreview | null
  loading: boolean
  error: string | null
}

/**
 * Loads what syncing `tnr` into `tournamentId` (or importing it, when null) would
 * write. Mount it with a key per tnr/tournament: it loads once per mount.
 */
export function useChessResultsPreview(tnr: number | null, tournamentId: number | null): PreviewState {
  const [state, setState] = useState<PreviewState>({ preview: null, loading: !!tnr, error: null })
  useEffect(() => {
    if (!tnr) return
    let cancelled = false
    const query = `url=${tnr}${tournamentId ? `&tournamentId=${tournamentId}` : ""}`
    apiCall(`/api/chess-results/preview?${query}`)
      .then((preview: ChessResultsPreview) => !cancelled && setState({ preview, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ preview: null, loading: false, error: err instanceof Error ? err.message : "No se pudo leer chess-results" }))
    return () => { cancelled = true }
  }, [tnr, tournamentId])
  return state
}

/** True when the preview can be confirmed (loaded, not linked elsewhere). */
export const canConfirmPreview = ({ preview, loading }: PreviewState) => !loading && !!preview?.plan && !preview.linkedTournament

/** Loading state, conflicts, the chess-results summary card and the full plan. */
export function ChessResultsPreviewBody({ state }: { state: PreviewState }) {
  const { preview, loading, error } = state
  return (
    <div className="space-y-3">
      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Leyendo chess-results y comparando con el sitio, puede tardar unos segundos…
        </p>
      )}
      {error && <ErrorAlert message={error} />}
      {preview?.linkedTournament && (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          <span>Ese torneo de chess-results ya está vinculado a <strong>{preview.linkedTournament.title}</strong>.</span>
        </p>
      )}
      {preview?.details && <ChessResultsPreviewCard preview={preview} hideCounts={!!preview.plan} />}
      {preview?.details && preview.plan && <ImportPlanView plan={preview.plan} details={preview.details} />}
    </div>
  )
}
