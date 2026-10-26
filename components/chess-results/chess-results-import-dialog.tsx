"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, ExternalLink, Info, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorAlert } from "@/components/error-alert"
import { parseChessResultsTnr } from "@/lib/chess-results/url"
import type { ChessResultsPreview, ChessResultsSyncResponse } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { ChessResultsPreviewCard } from "./chess-results-preview-card"
import { ImportPlanView } from "./plan/plan-view"
import { toastSyncReport } from "./format"

interface Club {
  id: number
  name: string
}

export interface ChessResultsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Link or tnr to preview as soon as the dialog opens. */
  initialUrl?: string
  /** Site admins: optionally pick the organizing club. */
  chooseClub?: boolean
  /** Club admins: the club the tournament is imported for. */
  club?: Club | null
  /** Called after importing (the toast offers to open it); by default the new tournament opens. */
  onImported?: (tournamentId: number) => void
}

const NO_CLUB = "none"

export function ChessResultsImportDialog(props: ChessResultsImportDialogProps) {
  // The content remounts on every open, so each opening starts from a clean state.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <ImportDialogContent {...props} />}
    </Dialog>
  )
}

function ImportDialogContent({ onOpenChange, initialUrl, chooseClub, club, onImported }: ChessResultsImportDialogProps) {
  const router = useRouter()
  const autoPreview = !!parseChessResultsTnr(initialUrl)
  const [url, setUrl] = useState(initialUrl ?? "")
  const [preview, setPreview] = useState<ChessResultsPreview | null>(null)
  const [busy, setBusy] = useState<"preview" | "import" | null>(autoPreview ? "preview" : null)
  const [error, setError] = useState<string | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubId, setClubId] = useState(NO_CLUB)

  const fetchPreview = useCallback((value: string) =>
    apiCall(`/api/chess-results/preview?url=${encodeURIComponent(value.trim())}`)
      .then(setPreview, (err) => setError(err instanceof Error ? err.message : "No se pudo leer chess-results"))
      .finally(() => setBusy(null)), [])

  const loadPreview = (value: string) => {
    setError(null)
    setPreview(null)
    if (!parseChessResultsTnr(value)) {
      setError("Link de chess-results inválido. Pegá el link del torneo o su número.")
      return
    }
    setBusy("preview")
    void fetchPreview(value)
  }

  useEffect(() => {
    if (autoPreview && initialUrl) void fetchPreview(initialUrl)
  }, [autoPreview, initialUrl, fetchPreview])

  useEffect(() => {
    if (!chooseClub) return
    fetch("/api/clubs").then((r) => r.json()).then((data) => setClubs(data.clubs ?? [])).catch(() => {})
  }, [chooseClub])

  const openTournament = (id: number) => {
    onOpenChange(false)
    router.push(`/torneos/${id}/editar`)
  }

  const handleImport = async () => {
    if (!preview) return
    setBusy("import")
    setError(null)
    try {
      const selectedClub = club?.id ?? (clubId === NO_CLUB ? null : Number(clubId))
      const result: ChessResultsSyncResponse = await apiCall("/api/chess-results/import", {
        method: "POST",
        body: JSON.stringify({ url: preview.tnr, clubId: selectedClub }),
      })
      const title = `Torneo importado: ${preview.details?.name ?? ""}`
      if (onImported) {
        toastSyncReport(title, result.report, { label: "Abrir", onClick: () => router.push(`/torneos/${result.tournamentId}/editar`) })
        onOpenChange(false)
        onImported(result.tournamentId)
      } else {
        toastSyncReport(title, result.report)
        openTournament(result.tournamentId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el torneo")
      // Already imported (or partially created): refresh the preview so it offers to open it.
      if ((err as { status?: number }).status !== 400) {
        apiCall(`/api/chess-results/preview?url=${preview.tnr}`).then(setPreview).catch(() => {})
      }
    } finally {
      setBusy(null)
    }
  }

  const linked = preview?.linkedTournament
  const canImport = !!preview?.details && preview.dates.length > 0 && !busy

  return (
    <DialogContent
      className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      onEscapeKeyDown={(e) => busy && e.preventDefault()}
      onInteractOutside={(e) => busy && e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Importar desde chess-results</DialogTitle>
        <DialogDescription>
          Crea el torneo con sus jugadores, rondas y resultados. Revisá todo lo que se va a cargar antes de confirmar.
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          loadPreview(url)
        }}
      >
        <Label htmlFor="chess-results-import-url" className="sr-only">Link de chess-results</Label>
        <Input
          id="chess-results-import-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text")
            if (parseChessResultsTnr(pasted)) setTimeout(() => loadPreview(pasted))
          }}
          placeholder="https://chess-results.com/tnr123456.aspx"
          autoFocus
          disabled={!!busy}
        />
        <Button type="submit" variant="outline" size="icon" disabled={!url.trim() || !!busy} aria-label="Buscar" title="Buscar">
          {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {busy === "preview" && (
        <p className="text-sm text-muted-foreground">Leyendo chess-results, puede tardar unos segundos…</p>
      )}
      {error && <ErrorAlert message={error} />}

      {linked && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <span>Ya está importado como <strong>{linked.title}</strong>.</span>
          </p>
          <Button size="sm" variant="outline" onClick={() => openTournament(linked.id)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir torneo
          </Button>
        </div>
      )}

      {preview && <ChessResultsPreviewCard preview={preview} hideCounts={!!preview.plan} />}
      {preview?.details && preview.plan && <ImportPlanView plan={preview.plan} details={preview.details} />}

      {preview?.details && chooseClub && !club && (
        <div className="space-y-2">
          <Label htmlFor="chess-results-import-club">Club organizador</Label>
          <Select value={clubId} onValueChange={setClubId} disabled={!!busy}>
            <SelectTrigger id="chess-results-import-club">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CLUB}>Ninguno (FASGBA)</SelectItem>
              {clubs.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {preview?.details && club && (
        <p className="text-sm text-muted-foreground">Se importará para <strong>{club.name}</strong>.</p>
      )}

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!busy}>
          Cancelar
        </Button>
        <Button onClick={handleImport} disabled={!canImport}>
          {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {busy === "import" ? "Importando…" : "Importar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
