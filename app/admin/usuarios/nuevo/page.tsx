"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase, supabaseAdmin } from "@/lib/supabaseClient"

interface Club {
  id: number
  name: string
}

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    club_id: "",
    birth_date: "",
    birth_gender: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch clubs for the select input
  useEffect(() => {
    async function fetchClubs() {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name')
          .order('name')

        if (error) throw error
        setClubs(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los clubes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClubs()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) errors.name = "El nombre es requerido"
    if (!formData.surname.trim()) errors.surname = "El apellido es requerido"
    if (!formData.email.trim()) errors.email = "El email es requerido"
    if (!formData.club_id) errors.club_id = "Debes seleccionar un club"
    if (!formData.birth_date) errors.birth_date = "La fecha de nacimiento es requerida"
    if (!formData.birth_gender) errors.birth_gender = "Debes seleccionar un género"

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

    try {
      console.log('Starting user creation process...')
      console.log('Form data:', formData)
      
      // First, create the Supabase auth user using the admin client
      console.log('Creating auth user...')
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.email, // Use email as password
        email_confirm: true,
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        throw authError
      }
      console.log('Auth user created successfully:', authData)

      // Prepare the user data
      const userData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        club_id: formData.club_id ? parseInt(formData.club_id) : null,
        birth_date: new Date(formData.birth_date).toISOString().split('T')[0], // Format as YYYY-MM-DD
        birth_gender: formData.birth_gender,
        auth_id: authData.user.id,
      }
      console.log('Attempting to insert user data:', userData)

      // Then, create the database user with the auth_id using the admin client
      console.log('Creating database user...')
      const { data: dbData, error: dbError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select('*')
        .single()

      if (dbError) {
        console.error('Database user creation error details:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        })
        // If database insert fails, we should clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Database error: ${dbError.message || 'Unknown error'}`)
      }
      console.log('Database user created successfully:', dbData)

      // Redirect back to users list
      router.push("/admin/usuarios")
    } catch (err) {
      console.error('Error in user creation process:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : "Error al crear el usuario"
      setError(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/usuarios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nuevo Usuario</h1>
          <p className="text-muted-foreground">Agrega un nuevo usuario al sistema.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={validationErrors.name ? "border-destructive" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="surname" className="text-sm font-medium">
              Apellido
            </label>
            <Input
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
              className={validationErrors.surname ? "border-destructive" : ""}
            />
            {validationErrors.surname && (
              <p className="text-sm text-destructive">{validationErrors.surname}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={validationErrors.email ? "border-destructive" : ""}
          />
          {validationErrors.email && (
            <p className="text-sm text-destructive">{validationErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="club_id" className="text-sm font-medium">
            Club
          </label>
          <Select
            value={formData.club_id}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, club_id: value }))
              if (validationErrors.club_id) {
                setValidationErrors((prev) => ({ ...prev, club_id: "" }))
              }
            }}
          >
            <SelectTrigger className={validationErrors.club_id ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecciona un club" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id.toString()}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.club_id && (
            <p className="text-sm text-destructive">{validationErrors.club_id}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="birth_date" className="text-sm font-medium">
              Fecha de nacimiento
            </label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              required
              className={validationErrors.birth_date ? "border-destructive" : ""}
            />
            {validationErrors.birth_date && (
              <p className="text-sm text-destructive">{validationErrors.birth_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="birth_gender" className="text-sm font-medium">
              Género
            </label>
            <Select
              value={formData.birth_gender}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, birth_gender: value }))
                if (validationErrors.birth_gender) {
                  setValidationErrors((prev) => ({ ...prev, birth_gender: "" }))
                }
              }}
            >
              <SelectTrigger className={validationErrors.birth_gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecciona un género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Masculino</SelectItem>
                <SelectItem value="Female">Femenino</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.birth_gender && (
              <p className="text-sm text-destructive">{validationErrors.birth_gender}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/usuarios")}
          >
            Cancelar
          </Button>
          <Button type="submit">Crear usuario</Button>
        </div>
      </form>
    </div>
  )
} 