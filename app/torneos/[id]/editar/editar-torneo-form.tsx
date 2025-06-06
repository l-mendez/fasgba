"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Calendar, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

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
  image?: string | null
  all_dates?: string[]
  formatted_all_dates?: string[]
  created_by_club_id?: number
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
  image: string
  dates: string[]
}

interface EditarTorneoFormProps {
  tournament: Tournament
  tournamentId: string
  isSiteAdmin: boolean
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión autenticada')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  const url = `${baseUrl}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`
    
    try {
      const errorData = await response.text()
      
      try {
        const jsonError = JSON.parse(errorData)
        errorMessage = jsonError.error || jsonError.message || errorMessage
      } catch {
        errorMessage = errorData || errorMessage
      }
    } catch {
      // Use default error message
    }
    
    throw new Error(errorMessage)
  }
  
  if (response.status === 204) {
    return null
  }
  
  return response.json()
}

export function EditarTorneoForm({ tournament, tournamentId, isSiteAdmin }: EditarTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  
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
      image: tournament.image || "",
      dates: formattedDates,
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

    if (formData.rounds && (isNaN(Number(formData.rounds)) || Number(formData.rounds) <= 0)) {
      errors.rounds = "El número de rondas debe ser un número positivo"
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
        image: formData.image.trim() || undefined,
        dates: formData.dates,
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(tournamentData).filter(([_, value]) => value !== undefined)
      )

      console.log('Updating tournament data:', cleanData)

      await apiCall(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanData)
      })

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

  const addDate = () => {
    if (!newDate) return
    
    // Check if date already exists
    if (formData.dates.includes(newDate)) {
      return
    }
    
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
    const date = new Date(dateString)
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

            <div className="space-y-2">
              <Label htmlFor="image">Imagen (URL)</Label>
              <Input
                id="image"
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          {/* Tournament Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-terracotta">Fechas del Torneo</h3>
            
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