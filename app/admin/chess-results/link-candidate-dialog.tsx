"use client"

import { useState } from "react"
import { Link2, Loader2, Repeat } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ChessResultsPreviewBody, canConfirmPreview, useChessResultsPreview } from "@/components/chess-results/chess-results-preview-body"
import { toastSyncReport } from "@/components/chess-results/format"
import { ReviewDialogContent } from "@/components/chess-results/review-dialog"
import type { ChessResultsSyncResponse } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"
import { TournamentPicker } from "./tournament-picker"
import type { CandidateItem, TournamentOption } from "./types"

interface LinkCandidateDialogProps {
  candidate: CandidateItem | null
  tournaments: TournamentOption[]
  onOpenChange: (open: boolean) => void
  onLinked: () => void
}

/** Link a discovered chess-results tournament to an existing site tournament, reviewing what gets imported. */
export function LinkCandidateDialog(props: LinkCandidateDialogProps) {
  return (
    <Dialog open={!!props.candidate} onOpenChange={props.onOpenChange}>
      {props.candidate && <LinkCandidateContent key={props.candidate.tnr} {...props} candidate={props.candidate} />}
    </Dialog>
  )
}

function LinkCandidateContent({ candidate, tournaments, onOpenChange, onLinked }: LinkCandidateDialogProps & { candidate: CandidateItem }) {
  const [selected, setSelected] = useState<number | null>(candidate.suggested?.id ?? null)
  // With a suggestion, go straight to the review; "Elegir otro torneo" goes back to the picker.
  const [reviewing, setReviewing] = useState(candidate.suggested != null)
  const [saving, setSaving] = useState(false)

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

  if (reviewing && selected != null) {
    const title = tournaments.find((t) => t.id === selected)?.title
    return (
      <ReviewStep key={selected} tnr={candidate.tnr} tournamentId={selected} title={title} saving={saving}
        onBack={() => setReviewing(false)} onCancel={() => onOpenChange(false)} onConfirm={link} />
    )
  }

  return (
    <ReviewDialogContent
      title="Vincular a un torneo existente"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => setReviewing(true)} disabled={selected == null}>
            Continuar
          </Button>
        </>
      }
    >
      <TournamentPicker candidate={candidate} tournaments={tournaments} selected={selected} onSelect={setSelected} />
    </ReviewDialogContent>
  )
}

interface ReviewStepProps {
  tnr: number
  tournamentId: number
  title?: string
  saving: boolean
  onBack: () => void
  onCancel: () => void
  onConfirm: () => void
}

/** Everything linking would import into the chosen tournament. */
function ReviewStep({ tnr, tournamentId, title, saving, onBack, onCancel, onConfirm }: ReviewStepProps) {
  const state = useChessResultsPreview(tnr, tournamentId)
  return (
    <ReviewDialogContent
      title="Revisar y vincular"
      busy={saving}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!canConfirmPreview(state) || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            {saving ? "Vinculando…" : "Vincular e importar"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0">Se vincula a <strong className="break-words">{title}</strong>. Solo se agrega lo que falta.</p>
          <Button variant="outline" size="sm" onClick={onBack} disabled={saving} className="shrink-0">
            <Repeat className="mr-2 h-4 w-4" />
            Elegir otro torneo
          </Button>
        </div>
        <ChessResultsPreviewBody state={state} />
      </div>
    </ReviewDialogContent>
  )
}
