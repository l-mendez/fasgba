"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorAlert } from "@/components/error-alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { TournamentFormFields, TOURNAMENT_FORM_ACTIONS_CLASS } from "@/components/tournament/tournament-form-fields"
import { apiCall } from "@/lib/utils/apiClient"
import { useTournamentForm } from "@/hooks/useTournamentForm"
import {
  createEmptyTournamentFormData,
  validateTournamentForm,
  buildTournamentApiPayload,
} from "@/lib/tournament-form-utils"

export interface OrganizerClub {
  id: number
  name: string
  address: string | null
}

interface NuevoTorneoFormProps {
  isSiteAdmin: boolean
  clubs: OrganizerClub[]
  /** Preselected organizer; null means FASGBA (site admins only). */
  defaultClubId: number | null
  returnPath: string
  /** Query appended to the editor link so it returns to the same panel. */
  editQuery: string
}

const FASGBA_VALUE = "none"

export function NuevoTorneoForm({ isSiteAdmin, clubs, defaultClubId, returnPath, editQuery }: NuevoTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubValue, setClubValue] = useState(defaultClubId ? String(defaultClubId) : FASGBA_VALUE)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTournamentId, setCreatedTournamentId] = useState<number | null>(null)

  const {
    formData, validationErrors, setValidationErrors, handleChange, handleSelectChange, addDate, removeDate,
  } = useTournamentForm(createEmptyTournamentFormData)

  const selectedClubId = clubValue === FASGBA_VALUE ? undefined : Number(clubValue)
  const singleClub = !isSiteAdmin && clubs.length === 1 ? clubs[0] : null

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
        router.push(returnPath)
      }
    } catch (err) {
      console.error('Error creating tournament:', err)
      setError(err instanceof Error ? err.message : "Error al crear el torneo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorAlert message={error} />}

            {singleClub ? (
              <div className="space-y-2">
                <Label>Club organizador</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{singleClub.name}</p>
                  {singleClub.address && (
                    <p className="text-sm text-muted-foreground">{singleClub.address}</p>
                  )}
                </div>
              </div>
            ) : clubs.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="club">Club organizador</Label>
                <Select
                  value={clubValue}
                  onValueChange={(value) => {
                    setClubValue(value)
                    if (validationErrors.club) {
                      setValidationErrors(prev => ({ ...prev, club: "" }))
                    }
                  }}
                >
                  <SelectTrigger id="club" className={validationErrors.club ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar club" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSiteAdmin && <SelectItem value={FASGBA_VALUE}>FASGBA</SelectItem>}
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.club && (
                  <p className="text-sm text-destructive">{validationErrors.club}</p>
                )}
              </div>
            ) : null}

            <TournamentFormFields
              formData={formData}
              validationErrors={validationErrors}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              onAddDate={addDate}
              onRemoveDate={removeDate}
            />

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
                {isLoading ? "Creando..." : "Crear torneo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-amber" />
              Torneo creado
            </DialogTitle>
            <DialogDescription>
              Configura rondas y partidas ahora o más tarde.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(returnPath)}
              className="w-full sm:w-auto"
            >
              Volver
            </Button>
            <Button
              onClick={() => {
                if (createdTournamentId) {
                  router.push(`/torneos/${createdTournamentId}/editar${editQuery}`)
                }
              }}
              className="w-full sm:w-auto"
            >
              Configurar torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
