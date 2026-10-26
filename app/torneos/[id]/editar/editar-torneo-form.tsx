"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { ErrorAlert } from "@/components/error-alert"
import { InfoPill } from "@/components/info-pill"
import { TournamentFormFields, TOURNAMENT_FORM_ACTIONS_CLASS } from "@/components/tournament/tournament-form-fields"
import { apiCall } from "@/lib/utils/apiClient"
import {
  tournamentToFormData,
  validateTournamentForm,
  buildTournamentApiPayload,
  type TournamentFormData,
  type TournamentFormSource,
} from "@/lib/tournament-form-utils"

interface EditarTorneoFormProps {
  tournament: TournamentFormSource & { id: string }
  tournamentId: string
  returnPath: string
}

// What the API deletes when the type changes (see PATCH /api/tournaments/[id]).
const TYPE_CHANGE_LOSSES = {
  individual: "las partidas y los registros individuales",
  team: "los equipos registrados, los enfrentamientos y sus partidas",
} as const

export function EditarTorneoForm({ tournament, tournamentId, returnPath }: EditarTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmTypeChange, setConfirmTypeChange] = useState(false)

  const [formData, setFormData] = useState<TournamentFormData>(() => tournamentToFormData(tournament))
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const originalType = tournament.tournament_type || 'individual'
  const hasTypeChanged = formData.tournament_type !== originalType

  const save = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // A type change is applied together with the rest of the edits.
      await apiCall(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        body: JSON.stringify(buildTournamentApiPayload(formData))
      })
      router.push(returnPath)
      router.refresh()
    } catch (err) {
      console.error('Error updating tournament:', err)
      setError(err instanceof Error ? err.message : "Error al actualizar el torneo")
      setIsLoading(false)
    } finally {
      setConfirmTypeChange(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    const errors = validateTournamentForm(formData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    if (hasTypeChanged) {
      setConfirmTypeChange(true)
      return
    }

    void save()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'tournament_type') {
      const newType = value as 'individual' | 'team'
      setFormData((prev) => ({
        ...prev,
        tournament_type: newType,
        ...(newType === 'individual' ? { players_per_team: "", max_teams: "", team_match_points: {} } : {}),
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const addDate = (date: string) => {
    if (!date || formData.dates.includes(date)) return

    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, date].sort()
    }))

    if (validationErrors.dates) {
      setValidationErrors(prev => ({ ...prev, dates: "" }))
    }
  }

  const removeDate = (dateToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter(date => date !== dateToRemove)
    }))
  }

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}

          <TournamentFormFields
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onAddDate={addDate}
            onRemoveDate={removeDate}
            isLoading={isLoading}
            tournamentTypeExtras={
              hasTypeChanged ? <InfoPill icon={Clock}>Cambio pendiente</InfoPill> : undefined
            }
          />

          {hasTypeChanged && (
            <div className="flex items-start gap-2 rounded-md border border-amber/50 bg-amber/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p>Al guardar se eliminarán {TYPE_CHANGE_LOSSES[originalType]}.</p>
            </div>
          )}

          <div className={TOURNAMENT_FORM_ACTIONS_CLASS}>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(returnPath)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>

      <AdminConfirmDialog
        open={confirmTypeChange}
        onOpenChange={setConfirmTypeChange}
        title="¿Cambiar el tipo de torneo?"
        description={`Se eliminarán ${TYPE_CHANGE_LOSSES[originalType]}. Los jugadores se mantienen.`}
        confirmLabel="Cambiar y guardar"
        onConfirm={save}
        pending={isLoading}
      />
    </Card>
  )
}
