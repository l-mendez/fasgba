"use client"

import { useState } from "react"
import { ArrowLeft, Link2, Loader2, Repeat } from "lucide-react"
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
      description={<span className="break-words">{candidate.name}</span>}
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
      description={
        <span className="flex flex-wrap items-center gap-x-2">
          <span>Se vincula a <strong className="text-foreground">{title}</strong>. Solo se agrega lo que falta.</span>
          <button type="button" onClick={onBack} disabled={saving} className="inline-flex items-center gap-1 font-medium text-terracotta underline-offset-4 hover:underline">
            <Repeat className="h-3.5 w-3.5" />
            Elegir otro torneo
          </button>
        </span>
      }
      busy={saving}
      footer={
        <>
          <Button variant="outline" onClick={onBack} disabled={saving} className="sm:mr-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!canConfirmPreview(state) || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            {saving ? "Vinculando…" : "Vincular e importar"}
          </Button>
        </>
      }
    >
      <ChessResultsPreviewBody state={state} />
    </ReviewDialogContent>
  )
}
