"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ChevronLeft } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useClubContext } from "../../context/club-context"
import { useToast } from "@/components/ui/use-toast"
import { supabase, supabaseAdmin } from "@/lib/supabaseClient"

export default function NuevoMiembroPage() {
  const router = useRouter()
  const { selectedClub } = useClubContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    elo: "",
    fechaNacimiento: "",
    genero: "",
    activo: true,
    enviarCredenciales: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClub) {
      setError('No hay un club seleccionado. Por favor, selecciona un club antes de continuar.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log('Starting member creation process...')
      console.log('Form data:', formData)

      // 1. Crear cuenta de autenticación en Supabase usando el admin client
      console.log('Creating auth user...')
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.email, // Usar email como contraseña
        email_confirm: true,
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        throw authError
      }
      console.log('Auth user created successfully:', authData)

      // 2. Crear el usuario en la base de datos vinculado al club y a la cuenta auth
      console.log('Creating database user record...')
      const userData = {
        name: formData.nombre,
        surname: formData.apellido,
        email: formData.email,
        birth_date: formData.fechaNacimiento,
        birth_gender: formData.genero === 'masculino' ? 'Male' : 'Female',
        club_id: selectedClub.id,
        auth_id: authData.user.id,
        active: formData.activo
      }
      console.log('Attempting to insert user data:', userData)
      
      const { data: dbUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()

      if (userError) {
        console.error('Database user creation error:', userError)
        // Si ocurre error, eliminar la cuenta auth para evitar usuarios huérfanos
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw userError
      }
      console.log('Database user created successfully:', dbUser)

      // 3. Si se ha proporcionado un ELO, registrarlo en elohistory
      if (formData.elo && dbUser && dbUser[0]?.id) {
        console.log('Adding ELO record...')
        const { error: eloError } = await supabase
          .from('elohistory')
          .insert([
            {
              user_id: dbUser[0].id,
              elo: parseInt(formData.elo),
              recorded_at: new Date().toISOString()
            }
          ])

        if (eloError) {
          console.error('Error al registrar ELO:', eloError)
          // No interrumpimos el flujo si falla esto
        }
      }

      // 4. Si se marcó la opción de enviar credenciales, mostrar mensaje informativo
      if (formData.enviarCredenciales) {
        console.log('User notification info:')
        console.log('- Email:', formData.email)
        console.log('- Password (temporary):', formData.email)
        
        toast({
          title: "Credenciales creadas",
          description: `Credenciales para ${formData.nombre}: email=${formData.email}, password=${formData.email}`,
          duration: 10000,
        })
      }

      // Mostrar mensaje de éxito
      toast({
        title: "Miembro creado",
        description: `${formData.nombre} ${formData.apellido} ha sido agregado al club.`,
        duration: 5000,
      })

      // Redireccionar a la lista de miembros
      router.push("/club-admin/miembros")
    } catch (err) {
      console.error('Error al crear miembro:', err)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al crear el miembro')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-4rem)]">
        <div className="text-xl font-medium text-muted-foreground">No hay un club seleccionado</div>
        <p className="mt-2 text-sm text-muted-foreground">Por favor, selecciona un club antes de agregar miembros</p>
        <Button className="mt-4" asChild>
          <Link href="/club-admin">Volver al dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/club-admin/miembros">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Miembro</h1>
          <p className="text-muted-foreground">Crea una nueva cuenta para un miembro de {selectedClub.nombre}.</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del miembro</CardTitle>
            <CardDescription>
              Ingresa los datos del nuevo miembro. Se creará una cuenta de usuario automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <p className="text-xs text-muted-foreground">
                Este email se utilizará para el inicio de sesión y comunicaciones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="elo">ELO (opcional)</Label>
                <Input id="elo" name="elo" type="number" value={formData.elo} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  La categoría se determinará automáticamente según la edad.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genero">Género</Label>
              <Select value={formData.genero} onValueChange={(value) => handleSelectChange("genero", value)} required>
                <SelectTrigger id="genero">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleCheckboxChange("activo", checked as boolean)}
              />
              <Label htmlFor="activo" className="text-sm font-normal">
                Usuario activo
              </Label>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="enviarCredenciales"
                checked={formData.enviarCredenciales}
                onCheckedChange={(checked) => handleCheckboxChange("enviarCredenciales", checked as boolean)}
              />
              <Label htmlFor="enviarCredenciales" className="text-sm font-normal">
                Mostrar credenciales de acceso al finalizar
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/club-admin/miembros">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear miembro"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

