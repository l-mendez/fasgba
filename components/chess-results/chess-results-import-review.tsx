"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Link2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorAlert } from "@/components/error-alert"
import { TournamentFormFields } from "@/components/tournament/tournament-form-fields"
import { useTournamentForm } from "@/hooks/useTournamentForm"
import { buildTournamentApiPayload, chessResultsToFormData, validateTournamentForm } from "@/lib/tournament-form-utils"
import type { ChessResultsPreview, ChessResultsSyncResponse } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { toastSyncReport } from "./format"
import { ImportPlanView } from "./plan/plan-view"
import { useAssignedPreview } from "./assign/use-assigned-preview"
import { useAssignProps } from "./chess-results-preview-body"
import { ReviewDialogContent } from "./review-dialog"

export interface ImportClub {
  id: number
  name: string
}

interface ChessResultsImportReviewProps {
  preview: ChessResultsPreview
  chooseClub?: boolean
  club?: ImportClub | null
  onOpenChange: (open: boolean) => void
  onImported?: (tournamentId: number) => void
  onOpenTournament: (id: number) => void
  /** Back to the link step (not shown when opened from a detected tournament). */
  onBack?: () => void
  suggestion?: { id: number; title: string } | null
  onLinkInstead?: () => void
}

const FASGBA = "none"

/** Second step of the import: edit the tournament data and review everything that comes with it. */
export function ChessResultsImportReview({ preview, chooseClub, club, onOpenChange, onImported, onOpenTournament, onBack, suggestion, onLinkInstead }: ChessResultsImportReviewProps) {
  const router = useRouter()
  const details = preview.details!
  const form = useTournamentForm(() => chessResultsToFormData(details, preview.dates, preview.plan))
  const assigned = useAssignedPreview(preview.tnr, null, preview)
  const assign = useAssignProps(assigned)
  const plan = assigned.state.preview?.plan ?? preview.plan!
  const [tab, setTab] = useState("datos")
  const [clubs, setClubs] = useState<ImportClub[]>([])
  const [clubValue, setClubValue] = useState(FASGBA)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<number | null>(null)

  useEffect(() => {
    if (!chooseClub || club) return
    fetch("/api/clubs").then((r) => r.json()).then((data) => setClubs(data.clubs ?? [])).catch(() => {})
  }, [chooseClub, club])

  const invalid = Object.values(form.validationErrors).some(Boolean)

  const importTournament = async () => {
    const errors = validateTournamentForm(form.formData)
    if (Object.keys(errors).length > 0) {
      form.setValidationErrors(errors)
      setTab("datos")
      setError("Revisá los datos del torneo antes de importar.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const clubId = club?.id ?? (clubValue === FASGBA ? null : Number(clubValue))
      const result: ChessResultsSyncResponse = await apiCall("/api/chess-results/import", {
        method: "POST",
        body: JSON.stringify({ url: preview.tnr, clubId, tournament: buildTournamentApiPayload(form.formData), assignments: assigned.assignments }),
      })
      const title = `Torneo importado: ${form.formData.title}`
      if (onImported) {
        toastSyncReport(title, result.report, { label: "Abrir", onClick: () => router.push(`/torneos/${result.tournamentId}/editar`) })
        onOpenChange(false)
        onImported(result.tournamentId)
      } else {
        toastSyncReport(title, result.report)
        onOpenTournament(result.tournamentId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el torneo")
      // Already imported, or created but incomplete: offer to open it.
      apiCall(`/api/chess-results/preview?url=${preview.tnr}`)
        .then((p: ChessResultsPreview) => setExistingId(p.linkedTournament?.id ?? null))
        .catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const dataTab = (
    <div className="space-y-6">
      {club ? (
        <p className="rounded-md bg-muted p-3 text-sm">Se importa para <strong>{club.name}</strong>.</p>
      ) : chooseClub && (
        <div className="space-y-2">
          <Label htmlFor="chess-results-import-club">Club organizador</Label>
          <Select value={clubValue} onValueChange={setClubValue} disabled={saving}>
            <SelectTrigger id="chess-results-import-club"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={FASGBA}>Ninguno (FASGBA)</SelectItem>
              {clubs.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <TournamentFormFields
        formData={form.formData}
        validationErrors={form.validationErrors}
        onChange={form.handleChange}
        onSelectChange={form.handleSelectChange}
        onAddDate={form.addDate}
        onRemoveDate={form.removeDate}
        isLoading={saving}
        importingFromChessResults
      />
    </div>
  )

  return (
    <ReviewDialogContent
      title="Revisar e importar"
      busy={saving}
      footer={
        <>
          {onBack && (
            <Button variant="outline" onClick={onBack} disabled={saving}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cambiar link
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          {existingId && (
            <Button variant="outline" onClick={() => onOpenTournament(existingId)}>Abrir torneo</Button>
          )}
          <Button onClick={importTournament} disabled={saving || !!existingId || assigned.updating}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {saving ? "Importando…" : "Importar torneo"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {suggestion && onLinkInstead && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber/50 bg-amber/15 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0">
              Parece ser <strong className="break-words">{suggestion.title}</strong>, que ya está en el sitio. Si es el mismo, vinculalo para no duplicarlo.
            </p>
            <Button variant="outline" size="sm" onClick={onLinkInstead} disabled={saving} className="shrink-0">
              <Link2 className="mr-2 h-4 w-4" />
              Vincular en su lugar
            </Button>
          </div>
        )}
        {error && <ErrorAlert message={error} />}
        {assigned.state.error && <ErrorAlert message={assigned.state.error} />}
        <ImportPlanView
          plan={plan}
          details={details}
          assign={assign ?? undefined}
          updating={assigned.updating}
          tab={tab}
          onTabChange={setTab}
          dataTab={{ label: "Datos del torneo", content: dataTab, invalid }}
        />
      </div>
    </ReviewDialogContent>
  )
}
