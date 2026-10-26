"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, ExternalLink, Info, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorAlert } from "@/components/error-alert"
import { parseChessResultsTnr } from "@/lib/chess-results/url"
import type { ChessResultsPreview } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { ChessResultsImportReview, type ImportClub } from "./chess-results-import-review"
import { ReviewDialogContent } from "./review-dialog"

export interface ChessResultsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Link or tnr to preview as soon as the dialog opens (skips the link step). */
  initialUrl?: string
  /** Site admins: optionally pick the organizing club. */
  chooseClub?: boolean
  /** Club admins: the club the tournament is imported for. */
  club?: ImportClub | null
  /** Called after importing (the toast offers to open it); by default the new tournament opens. */
  onImported?: (tournamentId: number) => void
}

export function ChessResultsImportDialog(props: ChessResultsImportDialogProps) {
  // The content remounts on every open, so each opening starts from a clean state.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <ImportDialogContent {...props} />}
    </Dialog>
  )
}

function ImportDialogContent(props: ChessResultsImportDialogProps) {
  const { onOpenChange, initialUrl } = props
  const router = useRouter()
  const fromCandidate = !!parseChessResultsTnr(initialUrl)
  const [url, setUrl] = useState(initialUrl ?? "")
  const [preview, setPreview] = useState<ChessResultsPreview | null>(null)
  const [loading, setLoading] = useState(fromCandidate)
  const [error, setError] = useState<string | null>(null)

  const fetchPreview = useCallback((value: string) =>
    apiCall(`/api/chess-results/preview?url=${encodeURIComponent(value.trim())}`)
      .then(setPreview, (err) => setError(err instanceof Error ? err.message : "No se pudo leer chess-results"))
      .finally(() => setLoading(false)), [])

  const loadPreview = (value: string) => {
    setError(null)
    if (!parseChessResultsTnr(value)) {
      setError("Link de chess-results inválido. Pegá el link del torneo o su número.")
      return
    }
    setLoading(true)
    void fetchPreview(value)
  }

  useEffect(() => {
    if (fromCandidate && initialUrl) void fetchPreview(initialUrl)
  }, [fromCandidate, initialUrl, fetchPreview])

  const openTournament = (id: number) => {
    onOpenChange(false)
    router.push(`/torneos/${id}/editar`)
  }

  // Review: the editable form plus everything that will be imported.
  if (preview?.details && preview.plan) {
    return (
      <ChessResultsImportReview
        {...props}
        preview={preview}
        onBack={fromCandidate ? undefined : () => setPreview(null)}
        onOpenTournament={openTournament}
      />
    )
  }

  const linked = preview?.linkedTournament
  return (
    <ReviewDialogContent
      title="Importar desde chess-results"
      busy={loading}
      footer={
        <>
          {preview && !fromCandidate && (
            <Button variant="outline" onClick={() => setPreview(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cambiar link
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {linked ? (
            <Button onClick={() => openTournament(linked.id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir torneo
            </Button>
          ) : (
            !fromCandidate && (
              <Button onClick={() => loadPreview(url)} disabled={!url.trim() || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {loading ? "Leyendo…" : "Continuar"}
              </Button>
            )
          )}
        </>
      }
    >
      <div className="space-y-4">
        {!fromCandidate && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              loadPreview(url)
            }}
          >
            <Label htmlFor="chess-results-import-url">Link de chess-results</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="chess-results-import-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text")
                  if (parseChessResultsTnr(pasted)) setTimeout(() => loadPreview(pasted))
                }}
                placeholder="https://chess-results.com/tnr123456.aspx"
                className="pl-8"
                inputMode="url"
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">También podés pegar solo el número del torneo.</p>
          </form>
        )}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Leyendo chess-results y comparando con el sitio, puede tardar unos segundos…
          </p>
        )}
        {error && <ErrorAlert message={error} />}
        {linked && (
          <p className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <span>Este torneo ya está importado como <strong>{linked.title}</strong>.</span>
          </p>
        )}
      </div>
    </ReviewDialogContent>
  )
}
