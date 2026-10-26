"use client"

import { Info, Loader2 } from "lucide-react"

import { ErrorAlert } from "@/components/error-alert"
import type { AssignProps } from "./assign/assign-rows"
import { useChessResultsOptions, type AssignedPreview, type PreviewState } from "./assign/use-assigned-preview"
import { ImportPlanView } from "./plan/plan-view"

export type { PreviewState }

/** True when the preview can be confirmed (loaded, not linked elsewhere, not recalculating). */
export const canConfirmPreview = ({ state, updating }: AssignedPreview) =>
  !state.loading && !updating && !!state.preview?.plan && !state.preview.linkedTournament

/** Picker data + the admin's choices, ready for the Equipos/Jugadores tabs (null while loading). */
export function useAssignProps(assigned: AssignedPreview): AssignProps | null {
  const options = useChessResultsOptions()
  if (!options) return null
  const { assignments } = assigned
  const newClubs = [...new Set([...Object.values(assignments.teams ?? {}), ...Object.values(assignments.players ?? {})]
    .flatMap((c) => ("club" in c && c.club && "newName" in c.club ? [c.club.newName] : [])))]
  return {
    options,
    newClubs,
    guestClubs: assignments.guestClubs ?? [],
    setGuestClub: assigned.setGuestClub,
    teamChoices: assignments.teams ?? {},
    playerChoices: assignments.players ?? {},
    setTeam: assigned.setTeam,
    setPlayer: assigned.setPlayer,
  }
}

/** Loading state, conflicts and the full, editable plan. */
export function ChessResultsPreviewBody({ assigned }: { assigned: AssignedPreview }) {
  const { preview, loading, error } = assigned.state
  const assign = useAssignProps(assigned)
  return (
    <div className="space-y-4">
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
      {preview?.details && preview.plan && (
        <ImportPlanView plan={preview.plan} details={preview.details} assign={assign ?? undefined} updating={assigned.updating} />
      )}
    </div>
  )
}
