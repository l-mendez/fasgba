"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorAlert } from "@/components/error-alert"
import { InfoPill } from "@/components/info-pill"
import { TournamentFormFields } from "@/components/tournament/tournament-form-fields"
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
  isSiteAdmin: boolean
}

export function EditarTorneoForm({ tournament, tournamentId, isSiteAdmin }: EditarTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [hasTypeChanged, setHasTypeChanged] = useState(false)

  const [formData, setFormData] = useState<TournamentFormData>(() => tournamentToFormData(tournament))
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    const errors = validateTournamentForm(formData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const cleanData = buildTournamentApiPayload(formData)

      await apiCall(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanData)
      })

      setHasTypeChanged(false)

      const redirectPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"
      router.push(redirectPath)
    } catch (err) {
      console.error('Error updating tournament:', err)
      setError(err instanceof Error ? err.message : "Error al actualizar el torneo")
    } finally {
      setIsLoading(false)
    }
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
      const currentType = formData.tournament_type

      if (currentType !== newType) {
        let confirmMessage = ''
        let detailsMessage = ''

        if (currentType === 'team') {
          confirmMessage = '⚠️ CAMBIO DE TIPO DE TORNEO\n\nEstás cambiando de "Por Equipos" a "Individual".'
          detailsMessage = '\nEsto eliminará:\n• Todos los enfrentamientos entre clubes\n• Todas las partidas por equipos\n• Registros de equipos\n• Configuración de equipos\n\nLos jugadores se mantendrán en el sistema.\n\n¿Continuar con el cambio?'
        } else {
          confirmMessage = '⚠️ CAMBIO DE TIPO DE TORNEO\n\nEstás cambiando de "Individual" a "Por Equipos".'
          detailsMessage = '\nEsto eliminará:\n• Todas las partidas individuales\n• Registros individuales de jugadores\n\nLos jugadores se mantendrán en el sistema.\n\n¿Continuar con el cambio?'
        }

        if (!confirm(confirmMessage + detailsMessage)) {
          return
        }

        setIsLoading(true)
        setError(null)

        apiCall(`/api/tournaments/${tournamentId}`, {
          method: 'PATCH',
          body: JSON.stringify({ tournament_type: newType })
        })
        .then(() => {
          setFormData((prev) => ({
            ...prev,
            tournament_type: newType,
            ...(newType === 'individual' ? {
              players_per_team: "",
              max_teams: "",
              team_match_points: {}
            } : {})
          }))
          setHasTypeChanged(false)
          window.location.reload()
        })
        .catch((err) => {
          console.error('Error updating tournament type:', err)
          setError(err instanceof Error ? err.message : "Error al cambiar el tipo de torneo")
        })
        .finally(() => {
          setIsLoading(false)
        })

        return
      }

      setFormData((prev) => ({
        ...prev,
        tournament_type: newType,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const addDate = () => {
    if (!newDate || formData.dates.includes(newDate)) return

    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, newDate].sort()
    }))
    setNewDate("")

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

  const cancelPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}

          <TournamentFormFields
            formData={formData}
            validationErrors={validationErrors}
            newDate={newDate}
            setNewDate={setNewDate}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onAddDate={addDate}
            onRemoveDate={removeDate}
            isLoading={isLoading}
            tournamentTypeExtras={
              hasTypeChanged ? (
                <InfoPill icon={Clock}>Cambio pendiente</InfoPill>
              ) : undefined
            }
          />

          {hasTypeChanged && !isLoading && (
            <div className="flex items-start gap-2 rounded-md border border-amber/50 bg-amber/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p>Cambiar el tipo de torneo eliminará los datos incompatibles al guardar.</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm text-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber" />
              <p>Procesando cambio de tipo. La página se recargará al terminar.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(cancelPath)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
