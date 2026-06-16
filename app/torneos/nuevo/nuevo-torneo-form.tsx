"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorAlert } from "@/components/error-alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { TournamentFormFields } from "@/components/tournament/tournament-form-fields"
import { apiCall } from "@/lib/utils/apiClient"
import {
  createEmptyTournamentFormData,
  validateTournamentForm,
  buildTournamentApiPayload,
  type TournamentFormData,
} from "@/lib/tournament-form-utils"

interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface NuevoTorneoFormProps {
  isSiteAdmin: boolean
  clubs: Club[]
  selectedClub: Club | null
}

export function NuevoTorneoForm({ isSiteAdmin, clubs, selectedClub }: NuevoTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [selectedClubId, setSelectedClubId] = useState<number | undefined>(
    selectedClub?.id
  )
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTournamentId, setCreatedTournamentId] = useState<number | null>(null)

  const [formData, setFormData] = useState<TournamentFormData>(createEmptyTournamentFormData())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    const errors = validateTournamentForm(formData, {
      isSiteAdmin,
      selectedClubId,
    })
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const cleanData = {
        ...buildTournamentApiPayload(formData),
        ...(selectedClubId && { created_by_club: selectedClubId }),
      }

      const result = await apiCall('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      })

      if (result && result.id) {
        setCreatedTournamentId(result.id)
        setShowSuccessDialog(true)
      } else {
        const redirectPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"
        router.push(redirectPath)
      }
    } catch (err) {
      console.error('Error creating tournament:', err)
      setError(err instanceof Error ? err.message : "Error al crear el torneo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tournament_type' ? value as 'individual' | 'team' : value
    }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }

    if (name === 'tournament_type' && value === 'individual') {
      setFormData((prev) => ({
        ...prev,
        players_per_team: "",
        max_teams: "",
        team_match_points: {}
      }))
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-terracotta">Nuevo Torneo</CardTitle>
          <CardDescription>Completa los detalles del nuevo torneo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorAlert message={error} />}

            {isSiteAdmin && clubs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-terracotta">Club Organizador</h3>
                <div className="space-y-2">
                  <Label htmlFor="club">Club (opcional)</Label>
                  <Select
                    value={selectedClubId?.toString()}
                    onValueChange={(value) => {
                      setSelectedClubId(value === "none" ? undefined : parseInt(value))
                      if (validationErrors.club) {
                        setValidationErrors(prev => ({ ...prev, club: "" }))
                      }
                    }}
                  >
                    <SelectTrigger className={validationErrors.club ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar club (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">FASGBA</SelectItem>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id.toString()}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.club && (
                    <p className="text-sm text-red-500">{validationErrors.club}</p>
                  )}
                </div>
              </div>
            )}

            {!isSiteAdmin && selectedClub && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-terracotta">Club Organizador</h3>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedClub.name}</p>
                  {selectedClub.location && (
                    <p className="text-sm text-muted-foreground">{selectedClub.location}</p>
                  )}
                </div>
              </div>
            )}

            <TournamentFormFields
              formData={formData}
              validationErrors={validationErrors}
              newDate={newDate}
              setNewDate={setNewDate}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              onAddDate={addDate}
              onRemoveDate={removeDate}
            />

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-terracotta hover:bg-terracotta/90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creando..." : "Crear Torneo"}
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">¡Torneo Creado Exitosamente!</DialogTitle>
                <DialogDescription className="mt-1">
                  El torneo "{formData.title}" ha sido creado correctamente.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Qué te gustaría hacer ahora?
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-lg border bg-muted/50">
                <h4 className="font-medium mb-2">Configurar Torneo</h4>
                <p className="text-sm text-muted-foreground">
                  Ir a la página de edición para configurar equipos, rondas, partidas y jugadores.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <h4 className="font-medium mb-2">Volver al Menú</h4>
                <p className="text-sm text-muted-foreground">
                  Regresar al panel de administración. Podrás configurar el torneo más tarde.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(cancelPath)}
              className="w-full sm:w-auto"
            >
              Volver al Menú
            </Button>
            <Button
              onClick={() => {
                if (createdTournamentId) {
                  router.push(`/torneos/${createdTournamentId}/editar`)
                }
              }}
              className="w-full sm:w-auto bg-terracotta hover:bg-terracotta/90"
            >
              Configurar Torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
