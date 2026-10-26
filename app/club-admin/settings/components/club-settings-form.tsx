"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, Upload, X, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"

import { apiCall } from "@/lib/utils/apiClient"
import { uploadClubImageAction, deleteClubImageAction } from "@/lib/actions/clubs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
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
  mail: z.email("Formato de email inválido").max(255, "El email es muy largo").optional().nullable().or(z.literal("")),
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
  const [confirmRemoveImage, setConfirmRemoveImage] = useState(false)
  const [isRemovingImage, setIsRemovingImage] = useState(false)
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

      // Upload the image via server action
      const result = await uploadClubImageAction(club.id, formData)

      if (!result.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setCurrentImage(result.data.filePath)
      setImagePreview(null)
      toast.success(result.data.replacedExisting ? 'Imagen actualizada' : 'Imagen subida')
      router.refresh()
    } catch (error) {
      console.error('Error uploading image:', error)
      setImagePreview(null)
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Removal applies immediately, like uploads.
  const handleImageRemove = async () => {
    try {
      setIsRemovingImage(true)
      const result = await deleteClubImageAction(club.id)
      if (!result.ok) throw new Error(result.error || 'No se pudo quitar la imagen')
      setCurrentImage(null)
      setImagePreview(null)
      toast.success('Imagen quitada')
      router.refresh()
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo quitar la imagen')
    } finally {
      setIsRemovingImage(false)
      setConfirmRemoveImage(false)
    }
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
      
      // Update club information
      await apiCall(`/api/clubs/${club.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData),
      })
      
      toast.success("Cambios guardados")
      form.reset(data)
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
      <Card>
        <CardHeader>
          <CardTitle className="text-terracotta">Imagen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentImage || imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview || getCurrentImageUrl() || ''}
                  alt="Imagen del club"
                  className="h-32 w-32 object-contain bg-white rounded-lg border"
                />
                {isUploadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                    <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setConfirmRemoveImage(true)}
                    disabled={isLoading || isRemovingImage}
                    aria-label="Quitar imagen"
                    title="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="w-full rounded-lg border-2 border-dashed p-6 text-center hover:border-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isLoading}
              >
                <ImageIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <span className="flex items-center justify-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  Subir imagen
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  JPG, PNG, GIF o WebP (máx. 5MB)
                </span>
              </button>
            )}

            {currentImage || imagePreview ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isLoading || isRemovingImage}
              >
                <Upload className="mr-2 h-4 w-4" />
                Cambiar imagen
              </Button>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(event) => {
                handleFileSelect(event)
                event.target.value = ''
              }}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={confirmRemoveImage}
        onOpenChange={setConfirmRemoveImage}
        title="¿Quitar imagen?"
        confirmLabel="Quitar"
        onConfirm={handleImageRemove}
        pending={isRemovingImage}
      />

      {/* Club Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-terracotta">Información</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del club *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-card py-3 md:static md:border-0 md:py-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isLoading || !form.formState.isDirty}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 
