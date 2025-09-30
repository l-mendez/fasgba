"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Calendar, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiCall } from "@/lib/utils/apiClient"
import { Badge } from "@/components/ui/badge"

interface Tournament {
  id: string
  title: string
  description?: string | null
  time?: string | null
  place?: string | null
  location?: string | null
  rounds?: number | null
  pace?: string | null
  inscription_details?: string | null
  cost?: string | null
  prizes?: string | null
  registration_link?: string | null
  all_dates?: string[]
  formatted_all_dates?: string[]
  created_by_club_id?: number
  tournament_type?: 'individual' | 'team' | null
  players_per_team?: number | null
  max_teams?: number | null
  registration_deadline?: string | null
  team_match_points?: Record<string, number> | null
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

interface EditarTorneoFormProps {
  tournament: Tournament
  tournamentId: string
  isSiteAdmin: boolean
}

export function EditarTorneoForm({ tournament, tournamentId, isSiteAdmin }: EditarTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [hasTypeChanged, setHasTypeChanged] = useState(false)
  
  // Initialize form data with tournament data
  const [formData, setFormData] = useState<FormData>(() => {
    const formattedDates = tournament.all_dates?.map((dateStr: string) => {
      const date = new Date(dateStr)
      return date.toISOString().split('T')[0]
    }) || []
    
    return {
      title: tournament.title || "",
      description: tournament.description || "",
      time: tournament.time || "",
      place: tournament.place || "",
      location: tournament.location || "",
      rounds: tournament.rounds ? String(tournament.rounds) : "",
      pace: tournament.pace || "",
      inscription_details: tournament.inscription_details || "",
      cost: tournament.cost || "",
      prizes: tournament.prizes || "",
      registration_link: tournament.registration_link || "",
      dates: formattedDates,
      tournament_type: tournament.tournament_type || 'individual',
      players_per_team: tournament.players_per_team ? String(tournament.players_per_team) : "",
      max_teams: tournament.max_teams ? String(tournament.max_teams) : "",
      registration_deadline: tournament.registration_deadline || "",
      team_match_points: tournament.team_match_points || {},
    }
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
        team_match_points: formData.team_match_points || undefined,
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(tournamentData).filter(([_, value]) => value !== undefined)
      )

      await apiCall(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanData)
      })

      // Reset the type changed flag since changes were saved
      setHasTypeChanged(false)

      // Redirect based on user role
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
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    // Special handling for tournament type changes
    if (name === 'tournament_type') {
      const newType = value as 'individual' | 'team'
      const currentType = formData.tournament_type
      
      // If changing tournament type, warn user about potential data loss
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
          return // User cancelled the change
        }
        
        // Immediately save the tournament type change
        setIsLoading(true)
        setError(null)
        
        // Create the update data with just the tournament type change
        const updateData = {
          tournament_type: newType
        }
        
        // Make the API call to update tournament type immediately
        apiCall(`/api/tournaments/${tournamentId}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData)
        })
        .then(() => {
          // Update the form state after successful API call
          setFormData((prev) => ({
            ...prev,
            tournament_type: newType,
            // Reset type-specific fields when switching
            ...(newType === 'individual' ? {
              players_per_team: "",
              max_teams: "",
              team_match_points: {}
            } : {})
          }))
          setHasTypeChanged(false) // Reset since we just saved
          
          // Force a page refresh to reload the tournament data and update the UI
          window.location.reload()
        })
        .catch((err) => {
          console.error('Error updating tournament type:', err)
          setError(err instanceof Error ? err.message : "Error al cambiar el tipo de torneo")
        })
        .finally(() => {
          setIsLoading(false)
        })
        
        return // Exit early since we're handling this asynchronously
      }
      
      // If no type change, just update normally
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
    
    // Clear validation error when user changes selection
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-terracotta">Editar Torneo</CardTitle>
        <CardDescription>Modifica los detalles del torneo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="tournament_type">Tipo de Torneo *</Label>
                {hasTypeChanged && (
                  <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/50">
                    Cambio pendiente
                  </Badge>
                )}
                {isLoading && (
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/50">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Guardando...
                  </Badge>
                )}
              </div>
              <Select 
                value={formData.tournament_type} 
                onValueChange={(value) => handleSelectChange('tournament_type', value as 'individual' | 'team')}
                disabled={isLoading}
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

          {/* Tournament Dates */}
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
              {isLoading ? "Actualizando..." : "Actualizar Torneo"}
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
  )
} 