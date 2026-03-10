"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface FormData {
  name: string
  title: string
  club_id: string
  birth_year: string
  bio: string
}

interface ClubOption {
  id: number
  name: string
}

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
    return null
  }

  return response.json()
}

export default function NuevoArbitroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    title: "",
    club_id: "",
    birth_year: "",
    bio: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchClubs() {
      try {
        const data = await apiCall('/clubs')
        setClubs(data.clubs || [])
      } catch (err) {
        console.error('Error fetching clubs:', err)
      }
    }
    fetchClubs()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido"
    }
    if (!formData.title.trim()) {
      errors.title = "El título es requerido"
    }
    if (formData.birth_year && (isNaN(Number(formData.birth_year)) || Number(formData.birth_year) < 1900 || Number(formData.birth_year) > new Date().getFullYear())) {
      errors.birth_year = "Año de nacimiento inválido"
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
      const arbitroData = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        club_id: formData.club_id ? Number(formData.club_id) : null,
        birth_year: formData.birth_year ? Number(formData.birth_year) : null,
        bio: formData.bio.trim() || null,
        photo: null,
      }

      await apiCall('/arbitros', {
        method: 'POST',
        body: JSON.stringify(arbitroData)
      })

      router.push("/admin/arbitros")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el árbitro")
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

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/arbitros">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Árbitro</h1>
          <p className="text-muted-foreground">Agrega un nuevo árbitro a FASGBA.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Árbitro Internacional, Árbitro FIDE, Árbitro Nacional"
              className={validationErrors.title ? "border-red-500" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-500">{validationErrors.title}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="club_id">Club</Label>
            <Select
              value={formData.club_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, club_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar club (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={String(club.id)}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="birth_year">Año de Nacimiento</Label>
            <Input
              id="birth_year"
              name="birth_year"
              type="number"
              value={formData.birth_year}
              onChange={handleChange}
              placeholder="Ej: 1985"
              min={1900}
              max={new Date().getFullYear()}
              className={validationErrors.birth_year ? "border-red-500" : ""}
            />
            {validationErrors.birth_year && (
              <p className="text-sm text-red-500">{validationErrors.birth_year}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Reseña Biográfica</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Breve descripción de la trayectoria del árbitro..."
              rows={4}
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
            onClick={() => router.push("/admin/arbitros")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Árbitro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
