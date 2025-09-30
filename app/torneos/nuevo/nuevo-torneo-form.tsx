"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Calendar, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { apiCall } from "@/lib/utils/apiClient"

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

interface FormData {
  title: string
  description: string
  time: string
  place: string
  location: string
  rounds: string
  pace: string
  inscription_details: string
  cost: string
  prizes: string
  registration_link: string
  dates: string[]
  tournament_type: 'individual' | 'team'
  players_per_team: string
  max_teams: string
  registration_deadline: string
  team_match_points: Record<string, number>
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
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    time: "",
    place: "",
    location: "",
    rounds: "",
    pace: "",
    inscription_details: "",
    cost: "",
    prizes: "",
    registration_link: "",
    dates: [],
    tournament_type: 'individual',
    players_per_team: "",
    max_teams: "",
    registration_deadline: "",
    team_match_points: {},
  })
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      errors.title = "El título es requerido"
    }
    
    if (formData.dates.length === 0) {
      errors.dates = "Debe agregar al menos una fecha"
    }

    // Validate rounds if provided
    if (formData.rounds && (isNaN(Number(formData.rounds)) || Number(formData.rounds) <= 0)) {
      errors.rounds = "El número de rondas debe ser un número positivo"
    }

    // Validate team tournament specific fields
    if (formData.tournament_type === 'team') {
      if (formData.players_per_team && (isNaN(Number(formData.players_per_team)) || Number(formData.players_per_team) <= 0)) {
        errors.players_per_team = "El número de jugadores por equipo debe ser un número positivo"
      }
      
      if (formData.max_teams && (isNaN(Number(formData.max_teams)) || Number(formData.max_teams) < 2)) {
        errors.max_teams = "El número máximo de equipos debe ser al menos 2"
      }
    }

    // Validate registration deadline
    if (formData.registration_deadline && formData.dates.length > 0) {
      const registrationDate = new Date(formData.registration_deadline)
      const earliestTournamentDate = new Date(Math.min(...formData.dates.map(date => new Date(date).getTime())))
      
      if (registrationDate >= earliestTournamentDate) {
        errors.registration_deadline = "La fecha límite de inscripción debe ser anterior al inicio del torneo"
      }
    }

    // For club admins, a club must be selected
    if (!isSiteAdmin && !selectedClubId) {
      errors.club = "Debe seleccionar un club"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Prepare data for API
      const tournamentData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        time: formData.time.trim() || undefined,
        place: formData.place.trim() || undefined,
        location: formData.location.trim() || undefined,
        rounds: formData.rounds ? Number(formData.rounds) : undefined,
        pace: formData.pace.trim() || undefined,
        inscription_details: formData.inscription_details.trim() || undefined,
        cost: formData.cost.trim() || undefined,
        prizes: formData.prizes.trim() || undefined,
        registration_link: formData.registration_link.trim() || undefined,
        dates: formData.dates,
        tournament_type: formData.tournament_type,
        players_per_team: formData.players_per_team ? Number(formData.players_per_team) : undefined,
        max_teams: formData.max_teams ? Number(formData.max_teams) : undefined,
        registration_deadline: formData.registration_deadline || undefined,
        team_match_points: Object.keys(formData.team_match_points).length > 0 ? formData.team_match_points : undefined,
        ...(selectedClubId && { created_by_club: selectedClubId })
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(tournamentData).filter(([_, value]) => value !== undefined)
      )

      const result = await apiCall('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      })

      // Show success dialog instead of auto-redirecting
      if (result && result.id) {
        setCreatedTournamentId(result.id)
        setShowSuccessDialog(true)
      } else {
        // Fallback to admin pages if no ID returned
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
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'tournament_type' ? value as 'individual' | 'team' : value 
    }))
    // Clear validation error when user changes selection
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
    
    // Reset team-specific fields when switching to individual
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
    if (!newDate) return
    
    // Check if date already exists
    if (formData.dates.includes(newDate)) {
      return
    }
    
    // Just use the date string directly - it's already in YYYY-MM-DD format
    // No need to convert through Date objects to avoid timezone issues
    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, newDate].sort()
    }))
    setNewDate("")
    
    // Clear validation error
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

  const formatDisplayDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-terracotta">Nuevo Torneo</CardTitle>
        <CardDescription>Completa los detalles del nuevo torneo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Club Selection for Site Admins */}
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

          {/* Club Info for Club Admins */}
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-terracotta">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nombre del torneo"
                  className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-500">{validationErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rounds">Número de Rondas</Label>
                <Input
                  id="rounds"
                  name="rounds"
                  type="number"
                  min="1"
                  value={formData.rounds}
                  onChange={handleChange}
                  placeholder="Ej: 7"
                  className={validationErrors.rounds ? "border-red-500" : ""}
                />
                {validationErrors.rounds && (
                  <p className="text-sm text-red-500">{validationErrors.rounds}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción detallada del torneo"
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Location and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-terracotta">Ubicación y Horario</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="place">Lugar</Label>
                <Input
                  id="place"
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  placeholder="Nombre del club o lugar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Dirección</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horario</Label>
              <Input
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="Ej: 15:00 hs"
              />
            </div>
          </div>

          {/* Tournament Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-terracotta">Detalles del Torneo</h3>
            
            {/* Tournament Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="tournament_type">Tipo de Torneo *</Label>
              <Select 
                value={formData.tournament_type} 
                onValueChange={(value) => handleSelectChange('tournament_type', value as 'individual' | 'team')}
              >
                <SelectTrigger className={validationErrors.tournament_type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar tipo de torneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Por Equipos</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.tournament_type && (
                <p className="text-sm text-red-500">{validationErrors.tournament_type}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.tournament_type === 'individual' 
                  ? 'Torneo individual donde cada jugador compite por separado'
                  : 'Torneo por equipos donde los clubes compiten entre sí'
                }
              </p>
            </div>

            {/* Team-specific fields */}
            {formData.tournament_type === 'team' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg transition-all duration-300 ease-in-out">
                <div className="space-y-2">
                  <Label htmlFor="players_per_team">Jugadores por Equipo</Label>
                  <Input
                    id="players_per_team"
                    name="players_per_team"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.players_per_team}
                    onChange={handleChange}
                    placeholder="Ej: 4"
                    className={validationErrors.players_per_team ? "border-red-500" : ""}
                  />
                  {validationErrors.players_per_team && (
                    <p className="text-sm text-red-500">{validationErrors.players_per_team}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_teams">Máximo de Equipos</Label>
                  <Input
                    id="max_teams"
                    name="max_teams"
                    type="number"
                    min="2"
                    max="100"
                    value={formData.max_teams}
                    onChange={handleChange}
                    placeholder="Ej: 16"
                    className={validationErrors.max_teams ? "border-red-500" : ""}
                  />
                  {validationErrors.max_teams && (
                    <p className="text-sm text-red-500">{validationErrors.max_teams}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pace">Ritmo de Juego</Label>
                <Input
                  id="pace"
                  name="pace"
                  value={formData.pace}
                  onChange={handleChange}
                  placeholder="Ej: 90 min + 30 seg/jugada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Costo de Inscripción</Label>
                <Input
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="Ej: $5000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscription_details">Detalles de Inscripción</Label>
              <Textarea
                id="inscription_details"
                name="inscription_details"
                value={formData.inscription_details}
                onChange={handleChange}
                placeholder="Información sobre cómo inscribirse"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizes">Premios</Label>
              <Textarea
                id="prizes"
                name="prizes"
                value={formData.prizes}
                onChange={handleChange}
                placeholder="Descripción de premios"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Registration and Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-terracotta">Inscripción y Fechas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="registration_link">Link de Inscripción</Label>
              <Input
                id="registration_link"
                name="registration_link"
                type="url"
                value={formData.registration_link}
                onChange={handleChange}
                placeholder="https://forms.google.com/..."
                className={validationErrors.registration_link ? "border-red-500" : ""}
              />
              {validationErrors.registration_link && (
                <p className="text-sm text-red-500">{validationErrors.registration_link}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Link externo para inscripción (ej: Google Forms, Typeform, etc.)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Fecha Límite de Inscripción</Label>
              <Input
                id="registration_deadline"
                name="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={handleChange}
                className={validationErrors.registration_deadline ? "border-red-500" : ""}
              />
              {validationErrors.registration_deadline && (
                <p className="text-sm text-red-500">{validationErrors.registration_deadline}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Fecha límite para que los participantes se inscriban al torneo
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Fechas del Torneo *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={validationErrors.dates ? "border-red-500" : ""}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addDate}
                  disabled={!newDate}
                  className="bg-terracotta hover:bg-terracotta/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {validationErrors.dates && (
                <p className="text-sm text-red-500">{validationErrors.dates}</p>
              )}

              {formData.dates.length > 0 && (
                <div className="space-y-2">
                  <Label>Fechas agregadas:</Label>
                  <div className="space-y-2">
                    {formData.dates.map((date) => (
                      <div key={date} className="flex items-center justify-between bg-muted p-3 rounded-md">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-terracotta" />
                          <span>{formatDisplayDate(date)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDate(date)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
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
              onClick={() => {
                const redirectPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"
                router.push(redirectPath)
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Success Dialog */}
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
            onClick={() => {
              const redirectPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"
              router.push(redirectPath)
            }}
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