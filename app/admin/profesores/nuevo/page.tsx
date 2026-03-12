"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, ImageIcon, Loader2, X } from "lucide-react"

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

interface Club {
  id: number
  name: string
}

interface FormData {
  titulo: string
  club_id: string
  anio_nacimiento: string
  modalidad: string
  zona: string
  biografia: string
  email: string
  telefono: string
  tarifa_horaria: string
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

export default function NuevoProfesorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    club_id: "",
    anio_nacimiento: "",
    modalidad: "presencial",
    zona: "",
    biografia: "",
    email: "",
    telefono: "",
    tarifa_horaria: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. El tamaño máximo es 5MB.")
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, GIF y WebP.")
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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

    if (!formData.titulo.trim()) {
      errors.titulo = "El nombre es requerido"
    }

    if (formData.anio_nacimiento) {
      const year = parseInt(formData.anio_nacimiento, 10)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        errors.anio_nacimiento = "Año de nacimiento no válido"
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email no válido"
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
      const profesorData = {
        titulo: formData.titulo.trim(),
        club_id: formData.club_id && formData.club_id !== "none" ? parseInt(formData.club_id, 10) : null,
        anio_nacimiento: formData.anio_nacimiento ? parseInt(formData.anio_nacimiento, 10) : null,
        modalidad: formData.modalidad,
        zona: formData.zona.trim() || null,
        biografia: formData.biografia.trim() || null,
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        tarifa_horaria: formData.tarifa_horaria.trim() || null,
      }

      const result = await apiCall('/profesores', {
        method: 'POST',
        body: JSON.stringify(profesorData)
      })

      // Upload image if selected
      if (selectedImage && result?.id) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const imageForm = new FormData()
          imageForm.append('image', selectedImage)
          await fetch(`/api/profesores/${result.id}/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            body: imageForm,
          })
        }
      }

      router.push("/admin/profesores")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el profesor")
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
          <Link href="/admin/profesores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Profesor</h1>
          <p className="text-muted-foreground">Agrega un nuevo profesor de ajedrez.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <div className="grid gap-2">
          <Label>Foto del Profesor</Label>
          <div className="space-y-3">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="h-32 w-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors max-w-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para subir una foto
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF o WebP (máx. 5MB)
                </p>
              </div>
            )}
            {imagePreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Cambiar foto
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="titulo">Nombre del Profesor *</Label>
            <Input
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: GM Roberto García"
              className={validationErrors.titulo ? "border-red-500" : ""}
            />
            {validationErrors.titulo && (
              <p className="text-sm text-red-500">{validationErrors.titulo}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="club_id">Club</Label>
            <Select
              value={formData.club_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar club (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin club</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={String(club.id)}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="anio_nacimiento">Año de Nacimiento</Label>
            <Input
              id="anio_nacimiento"
              name="anio_nacimiento"
              type="number"
              value={formData.anio_nacimiento}
              onChange={handleChange}
              placeholder="Ej: 1985"
              min={1900}
              max={new Date().getFullYear()}
              className={validationErrors.anio_nacimiento ? "border-red-500" : ""}
            />
            {validationErrors.anio_nacimiento && (
              <p className="text-sm text-red-500">{validationErrors.anio_nacimiento}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="modalidad">Modalidad</Label>
            <Select
              value={formData.modalidad}
              onValueChange={(value) => setFormData(prev => ({ ...prev, modalidad: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="zona">Zona</Label>
            <Input
              id="zona"
              name="zona"
              value={formData.zona}
              onChange={handleChange}
              placeholder="Ej: Zona Sur, Lomas de Zamora"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej: profesor@email.com"
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tarifa_horaria">Tarifa Horaria</Label>
            <Input
              id="tarifa_horaria"
              name="tarifa_horaria"
              value={formData.tarifa_horaria}
              onChange={handleChange}
              placeholder="Ej: $5000/hora, Consultar"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="biografia">Reseña Biográfica</Label>
            <Textarea
              id="biografia"
              name="biografia"
              value={formData.biografia}
              onChange={handleChange}
              placeholder="Breve descripción del profesor, su experiencia y logros..."
              rows={5}
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
            onClick={() => router.push("/admin/profesores")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Profesor"}
          </Button>
        </div>
      </form>
    </div>
  )
}
