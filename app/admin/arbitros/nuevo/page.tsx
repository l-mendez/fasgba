"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, ImageIcon, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FormData {
  name: string
  title: string
  club_id: string
  birth_year: string
  bio: string
  email: string
  phone: string
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
    email: "",
    phone: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. El tamaño máximo es 5MB.")
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, GIF y WebP.")
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido"
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
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        photo: null,
      }

      const result = await apiCall('/arbitros', {
        method: 'POST',
        body: JSON.stringify(arbitroData)
      })

      // Upload photo if one was selected
      if (selectedFile && result?.id) {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const uploadFormData = new globalThis.FormData()
            uploadFormData.append('image', selectedFile)

            await fetch(`/api/arbitros/${result.id}/upload-image`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${session.access_token}` },
              body: uploadFormData,
            })
          }
        } catch (uploadErr) {
          console.error('Error uploading photo:', uploadErr)
          toast.error("Árbitro creado, pero hubo un error al subir la foto.")
        }
      }

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
        {/* Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto del Árbitro</CardTitle>
            <CardDescription>Sube una foto del árbitro (máximo 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="h-32 w-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={handleImageRemove}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz clic para subir una foto del árbitro
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF o WebP (máx. 5MB)
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {imagePreview ? 'Cambiar foto' : 'Subir foto'}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej: arbitro@email.com"
                  className={`pl-8 ${validationErrors.email ? "border-red-500" : ""}`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej: +54 11 1234-5678"
                  className="pl-8"
                />
              </div>
            </div>
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
