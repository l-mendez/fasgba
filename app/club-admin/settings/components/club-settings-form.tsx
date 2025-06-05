"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save } from "lucide-react"

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
}

interface ClubSettingsFormProps {
  club: Club
}

export function ClubSettingsForm({ club }: ClubSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
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
      
      await apiCall(`/clubs/${club.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData),
      })
      
      toast.success("Configuración del club actualizada exitosamente")
      router.refresh()
    } catch (error) {
      console.error('Error updating club settings:', error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
  )
} 