"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"

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

  console.log('Making API request:', {
    url,
    method: config.method || 'GET',
    headers: config.headers
  })

  const response = await fetch(url, config)
  
  console.log('API response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  })
  
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`
    
    try {
      const errorData = await response.text()
      console.log('Error response body:', errorData)
      
      // Try to parse as JSON
      try {
        const jsonError = JSON.parse(errorData)
        errorMessage = jsonError.error || jsonError.message || errorMessage
        console.log('Parsed error:', jsonError)
      } catch {
        // If not JSON, use the text as error message
        errorMessage = errorData || errorMessage
      }
    } catch (readError) {
      console.error('Failed to read error response:', readError)
    }
    
    throw new Error(errorMessage)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  try {
    return await response.json()
  } catch (parseError) {
    console.error('Failed to parse response JSON:', parseError)
    throw new Error('Invalid response format')
  }
}

export default function NuevoTorneoPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  
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

      console.log('Sending tournament data:', cleanData)

      await apiCall('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      })

      // Redirect back to tournaments list
      router.push("/admin/torneos")
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
      setError("Esta fecha ya está agregada")
      return
    }
    
    setFormData((prev) => ({
      ...prev,
      dates: [...prev.dates, newDate].sort()
    }))
    setNewDate("")
    setError(null)
    
    // Clear validation error
    if (validationErrors.dates) {
      setValidationErrors((prev) => ({ ...prev, dates: "" }))
    }
  }

  const removeDate = (dateToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      dates: prev.dates.filter(date => date !== dateToRemove)
    }))
  }

  const formatDisplayDate = (dateString: string) => {
    try {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Debes estar autenticado para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/torneos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Torneo</h1>
          <p className="text-muted-foreground">Crea un nuevo torneo para FASGBA.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Información esencial del torneo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título del Torneo *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Gran Prix FASGBA 2025"
                className={validationErrors.title ? "border-red-500" : ""}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-500">{validationErrors.title}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción detallada del torneo..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="time">Horario</Label>
                <Input
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="Ej: 10:00 AM"
                />
              </div>

              <div className="grid gap-2">
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

            <div className="grid gap-2">
              <Label htmlFor="pace">Ritmo de Juego</Label>
              <Input
                id="pace"
                name="pace"
                value={formData.pace}
                onChange={handleChange}
                placeholder="Ej: 90 min + 30 seg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas del Torneo</CardTitle>
            <CardDescription>Agrega las fechas en que se realizará el torneo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Seleccionar fecha"
                />
              </div>
              <Button type="button" onClick={addDate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
            
            {validationErrors.dates && (
              <p className="text-sm text-red-500">{validationErrors.dates}</p>
            )}

            {formData.dates.length > 0 && (
              <div className="space-y-2">
                <Label>Fechas agregadas:</Label>
                <div className="space-y-2">
                  {formData.dates.map((date, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDisplayDate(date)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDate(date)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
            <CardDescription>Información sobre el lugar del torneo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="place">Lugar</Label>
              <Input
                id="place"
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="Ej: Club de Ajedrez Bahía Blanca"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Dirección</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Av. Colón 123, Bahía Blanca"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inscripción y Premios</CardTitle>
            <CardDescription>Información sobre inscripciones, costos y premios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="inscription_details">Detalles de Inscripción</Label>
              <Textarea
                id="inscription_details"
                name="inscription_details"
                value={formData.inscription_details}
                onChange={handleChange}
                placeholder="Información sobre cómo inscribirse, fechas límite, etc."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cost">Costo</Label>
              <Input
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="Ej: $5000 general, $3000 sub-18"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prizes">Premios</Label>
              <Textarea
                id="prizes"
                name="prizes"
                value={formData.prizes}
                onChange={handleChange}
                placeholder="Descripción de los premios..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagen</CardTitle>
            <CardDescription>Imagen representativa del torneo (opcional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="image">URL de la Imagen</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/torneos")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Torneo"}
          </Button>
        </div>
      </form>
    </div>
  )
}
