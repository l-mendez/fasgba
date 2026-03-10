"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, ImageIcon, Loader2, CheckCircle } from "lucide-react"

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
}

interface ClubOption {
  id: number
  name: string
}

interface PageProps {
  params: Promise<{
    id: string
  }>
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

export default function EditarArbitroPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getCurrentImageUrl = () => {
    if (!currentImage) return null
    const supabase = createClient()
    const { data } = supabase.storage.from('images').getPublicUrl(currentImage)
    return data.publicUrl
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await fetch(`/api/arbitros/${resolvedParams.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const result = await response.json()

      setCurrentImage(result.filePath)
      setImagePreview(null)
      setPendingImageDeletion(false)

      const actionMessage = result.replacedExisting ? 'reemplazada' : 'subida'
      toast.success(`Foto ${actionMessage} correctamente`, {
        description: "La foto del árbitro se ha actualizado exitosamente",
        duration: 4000,
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : "Error al subir la foto")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageRemove = () => {
    setPendingImageDeletion(true)
    setImagePreview(null)
  }

  const handleUndoImageDeletion = () => {
    setPendingImageDeletion(false)
  }

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

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      setPendingImageDeletion(false)
    }
    reader.readAsDataURL(file)

    handleImageUpload(file)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [arbitroData, clubsData] = await Promise.all([
          apiCall(`/arbitros/${resolvedParams.id}`),
          apiCall('/clubs'),
        ])

        if (arbitroData) {
          setFormData({
            name: arbitroData.name || "",
            title: arbitroData.title || "",
            club_id: arbitroData.club_id ? String(arbitroData.club_id) : "",
            birth_year: arbitroData.birth_year ? String(arbitroData.birth_year) : "",
            bio: arbitroData.bio || "",
          })
          setCurrentImage(arbitroData.photo)
        }

        setClubs(clubsData?.clubs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el árbitro")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

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

    if (!validateForm()) return

    setIsSaving(true)

    try {
      // Handle pending image deletion
      if (pendingImageDeletion && currentImage) {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No session found')

          const response = await fetch(`/api/arbitros/${resolvedParams.id}/delete-image`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to delete image')
          }

          setCurrentImage(null)
          setPendingImageDeletion(false)
        } catch (error) {
          console.error('Error deleting image:', error)
          throw new Error('No se pudo eliminar la foto. Intenta de nuevo.')
        }
      }

      const arbitroData = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        club_id: formData.club_id ? Number(formData.club_id) : null,
        birth_year: formData.birth_year ? Number(formData.birth_year) : null,
        bio: formData.bio.trim() || null,
      }

      await apiCall(`/arbitros/${resolvedParams.id}`, {
        method: 'PUT',
        body: JSON.stringify(arbitroData)
      })

      setShowSuccess(true)
      toast.success("Árbitro actualizado correctamente", {
        description: "Los cambios se han guardado exitosamente",
        duration: 4000,
      })

      setTimeout(() => setShowSuccess(false), 3000)
      setTimeout(() => router.push("/admin/arbitros"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el árbitro")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (error && !formData.name) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500">{error}</div>
        <Button variant="outline" onClick={() => router.push("/admin/arbitros")}>
          Volver a la lista
        </Button>
      </div>
    )
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
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Árbitro</h1>
          <p className="text-muted-foreground">Modifica la información del árbitro.</p>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Árbitro actualizado exitosamente
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Los cambios se han aplicado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto del Árbitro</CardTitle>
            <CardDescription>
              Sube una foto del árbitro (máximo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(currentImage || imagePreview) && !pendingImageDeletion && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || getCurrentImageUrl() || ''}
                    alt="Foto del árbitro"
                    className="h-32 w-32 object-cover rounded-lg border"
                  />
                  {!isUploadingImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleImageRemove}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {(!currentImage || pendingImageDeletion) && !imagePreview && (
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
                  {pendingImageDeletion && (
                    <div className="mt-3 pt-3 border-t border-dashed border-amber-300">
                      <p className="text-xs text-amber-600 font-medium mb-2">
                        La foto actual será eliminada al guardar
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                        onClick={handleUndoImageDeletion}
                        disabled={isSaving}
                      >
                        Deshacer eliminación
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {(currentImage && !pendingImageDeletion) || imagePreview ? 'Cambiar foto' : 'Subir foto'}
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

        {/* Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Árbitro</CardTitle>
            <CardDescription>
              Actualiza la información del árbitro
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  placeholder="Ej: Árbitro Internacional, Árbitro FIDE"
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
          </CardContent>
        </Card>

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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
