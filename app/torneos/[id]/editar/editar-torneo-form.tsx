"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorAlert } from "@/components/error-alert"
import { Badge } from "@/components/ui/badge"
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
      <CardHeader>
        <CardTitle className="text-2xl text-terracotta">Editar Torneo</CardTitle>
        <CardDescription>Modifica los detalles del torneo</CardDescription>
      </CardHeader>
      <CardContent>
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
                <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/50">
                  Cambio pendiente
                </Badge>
              ) : undefined
            }
          />

          {hasTypeChanged && !isLoading && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-md">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Importante:</strong> El cambio de tipo de torneo eliminará datos existentes incompatibles.
                Guarda los cambios para aplicar esta modificación.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Procesando cambio de tipo de torneo...</strong> La página se recargará automáticamente al completarse.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-terracotta hover:bg-terracotta/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Actualizando..." : "Actualizar Torneo"}
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
