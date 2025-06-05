"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, ImageIcon, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FormData {
  name: string
  address: string
  telephone: string
  mail: string
  schedule: string
}

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

interface PageProps {
  params: Promise<{
    id: string
  }>
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

export default function EditarClubPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    telephone: "",
    mail: "",
    schedule: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (!currentImage) return null
    
    const supabase = createClient()
    const { data } = supabase.storage.from('images').getPublicUrl(currentImage)
    return data.publicUrl
  }

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    
    try {
      // Get session for authentication
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      // Create form data for upload
      const formData = new FormData()
      formData.append('image', file)

      // Upload image
      const response = await fetch(`/api/clubs/${resolvedParams.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const result = await response.json()
      
      // Update state
      setCurrentImage(result.filePath)
      setImagePreview(null)
      setPendingImageDeletion(false)
      
      // Show success toast
      const actionMessage = result.replacedExisting ? 'reemplazada' : 'subida'
      toast.success(`✅ Imagen ${actionMessage} correctamente`, {
        description: "La imagen del club se ha actualizado exitosamente",
        duration: 4000,
      })

    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen")
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle image removal (mark for deletion)
  const handleImageRemove = async () => {
    setPendingImageDeletion(true)
    setImagePreview(null)
  }

  // Undo image deletion
  const handleUndoImageDeletion = () => {
    setPendingImageDeletion(false)
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. El tamaño máximo es 5MB.")
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, GIF y WebP.")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      setPendingImageDeletion(false)
    }
    reader.readAsDataURL(file)

    // Upload the image
    handleImageUpload(file)
  }

  // Fetch club data
  useEffect(() => {
    async function fetchClub() {
      try {
        const data = await apiCall(`/clubs/${resolvedParams.id}`)

        if (data) {
          setFormData({
            name: data.name || "",
            address: data.address || "",
            telephone: data.telephone || "",
            mail: data.mail || "",
            schedule: data.schedule || "",
          })
          setCurrentImage(data.image)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el club")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClub()
  }, [resolvedParams.id])

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      // Handle pending image deletion
      if (pendingImageDeletion && currentImage) {
        try {
          // Get session for authentication
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            throw new Error('No session found')
          }

          // Call the delete image API endpoint
          const response = await fetch(`/api/clubs/${resolvedParams.id}/delete-image`, {
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
          
          // Update local state
          setCurrentImage(null)
          setPendingImageDeletion(false)
        } catch (error) {
          console.error('Error deleting image:', error)
          throw new Error('No se pudo eliminar la imagen. Intenta de nuevo.')
        }
      }

      const clubData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        telephone: formData.telephone.trim() || null,
        mail: formData.mail.trim() || null,
        schedule: formData.schedule.trim() || null,
      }

      await apiCall(`/clubs/${resolvedParams.id}`, {
        method: 'PUT',
        body: JSON.stringify(clubData)
      })

      // Show success feedback
      setShowSuccess(true)
      toast.success("✅ Club actualizado correctamente", {
        description: "Los cambios se han guardado exitosamente",
        duration: 4000,
      })
      
      // Hide success indicator after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

      // Redirect back to clubs list after a short delay
      setTimeout(() => {
        router.push("/admin/clubes")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el club")
    } finally {
      setIsSaving(false)
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500">{error}</div>
        <Button variant="outline" onClick={() => router.push("/admin/clubes")}>
          Volver a la lista
        </Button>
      </div>
    )
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
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Club</h1>
          <p className="text-muted-foreground">Modifica la información del club.</p>
        </div>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                ¡Club actualizado exitosamente!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Los cambios en la información del club se han aplicado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Club Image Section */}
        <Card>
          <CardHeader>
            <CardTitle>Imagen del Club</CardTitle>
            <CardDescription>
              Sube una imagen representativa del club (máximo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Image Display */}
              {(currentImage || imagePreview) && !pendingImageDeletion && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || getCurrentImageUrl() || ''}
                    alt="Imagen del club"
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

              {/* Upload Area */}
              {(!currentImage || pendingImageDeletion) && !imagePreview && (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Haz clic para subir una imagen del club
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF o WebP (máx. 5MB)
                  </p>
                  {pendingImageDeletion && (
                    <div className="mt-3 pt-3 border-t border-dashed border-amber-300">
                      <p className="text-xs text-amber-600 font-medium mb-2">
                        ⚠️ La imagen actual será eliminada al guardar
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

              {/* Upload Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {(currentImage && !pendingImageDeletion) || imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                </Button>
              </div>

              {/* Hidden file input */}
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

        {/* Club Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Club</CardTitle>
            <CardDescription>
              Actualiza la información básica del club
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            onClick={() => router.push("/admin/clubes")}
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