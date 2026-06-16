"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, ImageIcon, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/error-alert"
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
import { uploadProfesorImageAction } from "@/lib/actions/profesores"
import { apiCall } from "@/lib/utils/apiClient"
import { getPublicImageUrl } from "@/lib/utils/storagePublicUrl"
import { toast } from "sonner"

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

interface Profesor {
  id: number
  titulo: string
  foto: string | null
  club_id: number | null
  anio_nacimiento: number | null
  modalidad: string
  zona: string | null
  biografia: string | null
  email: string | null
  telefono: string | null
  tarifa_horaria: string | null
}

interface EditarProfesorClientProps {
  profesor: Profesor
  initialClubs: Club[]
}

export function EditarProfesorClient({ profesor, initialClubs }: EditarProfesorClientProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubs] = useState<Club[]>(initialClubs)
  const [formData, setFormData] = useState<FormData>({
    titulo: profesor.titulo || "",
    club_id: profesor.club_id ? String(profesor.club_id) : "",
    anio_nacimiento: profesor.anio_nacimiento ? String(profesor.anio_nacimiento) : "",
    modalidad: profesor.modalidad || "presencial",
    zona: profesor.zona || "",
    biografia: profesor.biografia || "",
    email: profesor.email || "",
    telefono: profesor.telefono || "",
    tarifa_horaria: profesor.tarifa_horaria || "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(profesor.foto)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getCurrentImageUrl = () => {
    if (!currentImage) return null
    return getPublicImageUrl(currentImage)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)

    try {
      const fd = new FormData()
      fd.append('image', file)

      const result = await uploadProfesorImageAction(profesor.id, fd)

      if (!result.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setCurrentImage(result.data.filePath)
      setImagePreview(null)

      toast.success("Imagen subida correctamente", {
        description: "La foto del profesor se ha actualizado",
        duration: 4000,
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen")
    } finally {
      setIsUploadingImage(false)
    }
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
    }
    reader.readAsDataURL(file)

    handleImageUpload(file)
  }

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

    if (!validateForm()) return

    setIsSaving(true)

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

      await apiCall(`/api/profesores/${profesor.id}`, {
        method: 'PUT',
        body: JSON.stringify(profesorData)
      })

      setShowSuccess(true)
      toast.success("Profesor actualizado correctamente", {
        description: "Los cambios se han guardado exitosamente",
        duration: 4000,
      })

      setTimeout(() => setShowSuccess(false), 3000)
      setTimeout(() => router.push("/admin/profesores"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el profesor")
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

  if (error && !formData.titulo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ErrorAlert message={error} className="max-w-md" />
        <Button variant="outline" onClick={() => router.push("/admin/profesores")}>
          Volver a la lista
        </Button>
      </div>
    )
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
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Profesor</h1>
          <p className="text-muted-foreground">Modifica la información del profesor.</p>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Profesor actualizado exitosamente
              </h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto del Profesor</CardTitle>
            <CardDescription>
              Sube una foto del profesor (máximo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(currentImage || imagePreview) && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || getCurrentImageUrl() || ''}
                    alt="Foto del profesor"
                    className="h-32 w-32 object-cover rounded-lg border"
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {!currentImage && !imagePreview && (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz clic para subir una foto del profesor
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
                  disabled={isUploadingImage || isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {currentImage || imagePreview ? 'Cambiar foto' : 'Subir foto'}
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
            <CardTitle>Información del Profesor</CardTitle>
            <CardDescription>
              Actualiza la información del profesor
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            onClick={() => router.push("/admin/profesores")}
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
