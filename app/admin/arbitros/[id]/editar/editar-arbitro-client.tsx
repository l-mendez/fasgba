"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Upload, X, ImageIcon, Loader2, CheckCircle, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/error-alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { uploadArbitroImageAction, deleteArbitroImageAction } from "@/lib/actions/arbitros"
import { apiCall } from "@/lib/utils/apiClient"
import { getPublicImageUrl } from "@/lib/utils/storagePublicUrl"

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

interface Arbitro {
  id: number
  name: string
  title: string
  photo: string | null
  club_id: number | null
  birth_year: number | null
  bio: string | null
  email: string | null
  phone: string | null
}

interface EditarArbitroClientProps {
  arbitro: Arbitro
  initialClubs: ClubOption[]
}

export function EditarArbitroClient({ arbitro, initialClubs }: EditarArbitroClientProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubs] = useState<ClubOption[]>(initialClubs)
  const [formData, setFormData] = useState<FormData>({
    name: arbitro.name || "",
    title: arbitro.title || "",
    club_id: arbitro.club_id ? String(arbitro.club_id) : "",
    birth_year: arbitro.birth_year ? String(arbitro.birth_year) : "",
    bio: arbitro.bio || "",
    email: arbitro.email || "",
    phone: arbitro.phone || "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(arbitro.photo)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getCurrentImageUrl = () => {
    if (!currentImage) return null
    return getPublicImageUrl(currentImage)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const result = await uploadArbitroImageAction(arbitro.id, uploadFormData)

      if (!result.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setCurrentImage(result.data.filePath)
      setImagePreview(null)
      setPendingImageDeletion(false)

      const actionMessage = result.data.replacedExisting ? 'reemplazada' : 'subida'
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

    if (!validateForm()) return

    setIsSaving(true)

    try {
      // Handle pending image deletion
      if (pendingImageDeletion && currentImage) {
        try {
          const result = await deleteArbitroImageAction(arbitro.id)

          if (!result.ok) {
            throw new Error(result.error || 'Failed to delete image')
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
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
      }

      await apiCall(`/api/arbitros/${arbitro.id}`, {
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

  if (error && !formData.name) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ErrorAlert message={error} className="max-w-md" />
        <Button variant="outline" onClick={() => router.push("/admin/arbitros")}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/arbitros" aria-label="Volver" title="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Editar Árbitro</h1>
        </div>
      </div>

      {showSuccess && (
        <div className="rounded-lg border bg-muted p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-amber" />
            <p className="text-sm font-medium">Árbitro actualizado exitosamente</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto del Árbitro</CardTitle>
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
                      aria-label="Quitar imagen"
                      title="Quitar imagen"
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
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-amber"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz clic para subir una foto del árbitro
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF o WebP (máx. 5MB)
                  </p>
                  {pendingImageDeletion && (
                    <div className="mt-3 pt-3 border-t border-dashed border-amber/50">
                      <p className="mb-2 flex items-center justify-center gap-1 text-xs font-medium text-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber" />
                        La foto actual será eliminada al guardar
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
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
                  className={validationErrors.name ? "border-destructive" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
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
                  className={validationErrors.title ? "border-destructive" : ""}
                />
                {validationErrors.title && (
                  <p className="text-sm text-destructive">{validationErrors.title}</p>
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
                  className={validationErrors.birth_year ? "border-destructive" : ""}
                />
                {validationErrors.birth_year && (
                  <p className="text-sm text-destructive">{validationErrors.birth_year}</p>
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
                      className={`pl-8 ${validationErrors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
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
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
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
