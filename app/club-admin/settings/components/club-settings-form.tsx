"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, Upload, X, ImageIcon, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { apiCall } from "@/app/club-admin/context/club-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Form schema based on the club data structure
const clubSettingsSchema = z.object({
  name: z.string().min(1, "El nombre del club es requerido").max(255, "El nombre es muy largo"),
  address: z.string().max(500, "La dirección es muy larga").optional().nullable(),
  telephone: z.string().max(50, "El teléfono es muy largo").optional().nullable(),
  mail: z.string().email("Formato de email inválido").max(255, "El email es muy largo").optional().nullable().or(z.literal("")),
  schedule: z.string().max(500, "El horario es muy largo").optional().nullable(),
})

type ClubSettingsFormData = z.infer<typeof clubSettingsSchema>

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

interface ClubSettingsFormProps {
  club: Club
}

export function ClubSettingsForm({ club }: ClubSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(club.image)
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get current image public URL if exists
  const getCurrentImageUrl = () => {
    if (!currentImage) return null
    const { data } = supabase.storage.from('images').getPublicUrl(currentImage)
    return data.publicUrl
  }
  
  const form = useForm<ClubSettingsFormData>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      name: club.name,
      address: club.address || "",
      telephone: club.telephone || "",
      mail: club.mail || "",
      schedule: club.schedule || "",
    },
  })

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      // Upload the image
      const response = await fetch(`/api/clubs/${club.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const result = await response.json()
      
      // Update current image and clear preview
      setCurrentImage(result.filePath)
      setImagePreview(null)
      setPendingImageDeletion(false)
      
      // Show appropriate success message based on whether an image was replaced
      const successMessage = result.replacedExisting 
        ? '✅ Imagen actualizada correctamente'
        : '✅ Imagen subida correctamente'
      
      const successDescription = result.replacedExisting
        ? 'La imagen anterior ha sido reemplazada exitosamente'
        : 'La imagen del club se ha agregado exitosamente'
      
      toast.success(successMessage, {
        description: successDescription,
        duration: 3000,
      })
      router.refresh()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageRemove = async () => {
    // Mark image for deletion (don't delete immediately)
    setPendingImageDeletion(true)
    toast.success('✅ Imagen marcada para eliminación', {
      description: 'La imagen se eliminará cuando guardes los cambios',
      duration: 3000,
    })
  }

  const handleUndoImageDeletion = () => {
    setPendingImageDeletion(false)
    toast.success('Eliminación cancelada', {
      description: 'La imagen se mantendrá al guardar los cambios',
      duration: 2000,
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Usa JPG, PNG, GIF o WebP.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    handleImageUpload(file)
  }

  const onSubmit = async (data: ClubSettingsFormData) => {
    try {
      setIsLoading(true)
      
      // Clean up empty strings to null for consistency
      const cleanedData = {
        ...data,
        address: data.address?.trim() || null,
        telephone: data.telephone?.trim() || null,
        mail: data.mail?.trim() || null,
        schedule: data.schedule?.trim() || null,
      }
      
      // Handle pending image deletion
      if (pendingImageDeletion && currentImage) {
        try {
          // Get session for authentication
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            throw new Error('No session found')
          }

          // Call the delete image API endpoint
          const response = await fetch(`/api/clubs/${club.id}/delete-image`, {
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
      
      // Update club information
      await apiCall(`/clubs/${club.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData),
      })
      
      // Show success feedback
      setShowSuccess(true)
      toast.success("✅ Configuración actualizada correctamente", {
        description: "Los cambios se han guardado exitosamente",
        duration: 4000,
      })
      
      // Hide success indicator after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      
      router.refresh()
    } catch (error) {
      console.error('Error updating club settings:', error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                ¡Configuración guardada exitosamente!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Los cambios en la información del club se han aplicado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Club Image Section */}
      <Card>
        <CardHeader>
          <CardTitle>Imagen del Club</CardTitle>
          <CardDescription>
            Sube una imagen representativa de tu club (máximo 5MB)
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
                    disabled={isLoading}
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
                      disabled={isLoading}
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
                disabled={isUploadingImage || isLoading}
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
            Actualiza la información básica de tu club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Club *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Dirección del club"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Dirección física donde se encuentra el club
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+54 11 1234-5678"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="contacto@club.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horarios</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: Lunes a Viernes: 9:00 - 22:00, Sábados: 9:00 - 18:00"
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Horarios de atención y funcionamiento del club
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 