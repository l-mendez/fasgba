"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface FormData {
  name: string
  address: string
  telephone: string
  mail: string
  schedule: string
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
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
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  return response.json()
}

export default function NuevoClubPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    telephone: "",
    mail: "",
    schedule: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido"
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
      const clubData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        telephone: formData.telephone.trim() || null,
        mail: formData.mail.trim() || null,
        schedule: formData.schedule.trim() || null,
      }

      await apiCall('/clubs', {
        method: 'POST',
        body: JSON.stringify(clubData)
      })

      // Redirect back to clubs list
      router.push("/admin/clubes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el club")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clubes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Club</h1>
          <p className="text-muted-foreground">Agrega un nuevo club a FASGBA.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Club *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Club de Ajedrez Bahía Blanca"
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej: Av. Colón 123, Bahía Blanca"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telephone">Teléfono</Label>
            <Input
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="Ej: +54 291 123-4567"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mail">Correo Electrónico</Label>
            <Input
              id="mail"
              name="mail"
              type="email"
              value={formData.mail}
              onChange={handleChange}
              placeholder="Ej: info@club.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule">Horarios</Label>
            <Input
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              placeholder="Ej: Lunes a Viernes: 17:00 - 22:00"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/clubes")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Club"}
          </Button>
        </div>
      </form>
    </div>
  )
} 