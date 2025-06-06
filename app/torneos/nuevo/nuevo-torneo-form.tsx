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
import { createClient } from "@/lib/supabase/client"

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
  image: string
  dates: string[]
}

interface NuevoTorneoFormProps {
  isSiteAdmin: boolean
  clubs: Club[]
  selectedClub: Club | null
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

export function NuevoTorneoForm({ isSiteAdmin, clubs, selectedClub }: NuevoTorneoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [selectedClubId, setSelectedClubId] = useState<number | undefined>(
    selectedClub?.id
  )
  
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
    image: "",
    dates: [],
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
        image: formData.image.trim() || undefined,
        dates: formData.dates,
        // Only add club if user is not site admin or if site admin selected a club
        ...(selectedClubId && { created_by_club: selectedClubId })
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(tournamentData).filter(([_, value]) => value !== undefined)
      )

      console.log('Sending tournament data:', cleanData)

      await apiCall('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      })

      // Redirect based on user role
      const redirectPath = isSiteAdmin ? "/admin/torneos" : "/club-admin/torneos"
      router.push(redirectPath)
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
                    <SelectItem value="none">Sin club específico</SelectItem>
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
  )
} 