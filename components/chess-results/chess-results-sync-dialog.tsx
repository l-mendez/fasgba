"use client"

import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChessResultsPreviewBody, canConfirmPreview, useChessResultsPreview } from "./chess-results-preview-body"

interface ChessResultsSyncDialogProps {
  /** chess-results tournament to preview; the dialog is open while set. */
  tnr: number | null
  tournamentId: number
  onOpenChange: (open: boolean) => void
  /** Performs the sync; the dialog closes when it resolves. */
  onConfirm: () => Promise<void>
}

/** Shows everything a sync would write into an existing tournament before running it. */
export function ChessResultsSyncDialog(props: ChessResultsSyncDialogProps) {
  return (
    <Dialog open={props.tnr != null} onOpenChange={props.onOpenChange}>
      {props.tnr != null && <SyncDialogContent {...props} tnr={props.tnr} />}
    </Dialog>
  )
}

function SyncDialogContent({ tnr, tournamentId, onOpenChange, onConfirm }: ChessResultsSyncDialogProps & { tnr: number }) {
  const state = useChessResultsPreview(tnr, tournamentId)
  const [saving, setSaving] = useState(false)
  const confirm = async () => {
    setSaving(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent
      className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      onEscapeKeyDown={(e) => saving && e.preventDefault()}
      onInteractOutside={(e) => saving && e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Sincronizar con chess-results</DialogTitle>
        <DialogDescription>Revisá lo que se va a cargar. Solo se agrega lo que falta; no se modifica lo ya cargado.</DialogDescription>
      </DialogHeader>
      <ChessResultsPreviewBody state={state} />
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
        <Button onClick={confirm} disabled={!canConfirmPreview(state) || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {saving ? "Sincronizando…" : "Confirmar e importar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
