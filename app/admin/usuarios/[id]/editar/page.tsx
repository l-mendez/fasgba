"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, supabaseAdmin } from "@/lib/supabaseClient"

interface Club {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  surname: string
  email: string
  profile_picture: string | null
  biography: string | null
  club_id: number | null
  birth_date: string
  birth_gender: string
  page_admin: boolean
}

interface ClubAdmin {
  club_id: number
  user_id: number
  club: {
    id: number
    name: string
  }
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsAdmin, setClubsAdmin] = useState<ClubAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    club_id: "",
    birth_date: "",
    birth_gender: "",
    biography: "",
    page_admin: false,
    selectedClubAdmins: [] as number[],
  })

  // Fetch user data and clubs
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, surname, email, profile_picture, biography, club_id, birth_date, birth_gender, page_admin')
          .eq('id', userId)
          .single()
        
        if (userError) throw userError
        
        if (!userData) {
          throw new Error('Usuario no encontrado')
        }
        
        setUser(userData)
        
        // Fetch all clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('id, name')
          .order('name')
        
        if (clubsError) throw clubsError
        setClubs(clubsData || [])
        
        // Fetch club admin relationships
        const { data: clubAdminsData, error: clubAdminsError } = await supabase
          .from('club_admins')
          .select('club_id, user_id, club:club_id(id, name)')
          .eq('user_id', userId)
        
        if (clubAdminsError) throw clubAdminsError
        
        console.log('Club admins data structure:', JSON.stringify(clubAdminsData, null, 2))
        
        // Transform the data to match our ClubAdmin interface using type assertion
        const transformedClubAdmins: ClubAdmin[] = (clubAdminsData || []).map(item => {
          // Use type assertion to handle unknown shape
          const anyItem = item as any;
          const club_id = anyItem.club_id;
          const user_id = anyItem.user_id;
          
          // Handle club data safely
          let club = { id: 0, name: '' };
          
          if (anyItem.club) {
            if (Array.isArray(anyItem.club) && anyItem.club.length > 0) {
              club = {
                id: Number(anyItem.club[0].id) || 0,
                name: String(anyItem.club[0].name) || ''
              };
            } else {
              club = {
                id: Number(anyItem.club.id) || 0,
                name: String(anyItem.club.name) || ''
              };
            }
          }
          
          return {
            club_id,
            user_id,
            club
          };
        });
        
        setClubsAdmin(transformedClubAdmins)
        
        // Set initial form data
        setFormData({
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          club_id: userData.club_id ? userData.club_id.toString() : "none",
          birth_date: new Date(userData.birth_date).toISOString().split('T')[0],
          birth_gender: userData.birth_gender,
          biography: userData.biography || "",
          page_admin: userData.page_admin,
          selectedClubAdmins: (clubAdminsData || []).map(ca => ca.club_id),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los datos del usuario")
        console.error('Error loading user data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (userId) {
      fetchData()
    }
  }, [userId])
  
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) errors.name = "El nombre es requerido"
    if (!formData.surname.trim()) errors.surname = "El apellido es requerido"
    if (!formData.email.trim()) errors.email = "El email es requerido"
    if (!formData.birth_date) errors.birth_date = "La fecha de nacimiento es requerida"
    if (!formData.birth_gender) errors.birth_gender = "Debes seleccionar un género"

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // 1. Update user data
      const userData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        club_id: formData.club_id && formData.club_id !== "none" ? parseInt(formData.club_id) : null,
        birth_date: new Date(formData.birth_date).toISOString().split('T')[0],
        birth_gender: formData.birth_gender,
        biography: formData.biography,
        page_admin: formData.page_admin,
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
      
      if (updateError) throw updateError
      
      // 2. Update club admin relationships
      
      // First, get current club admin relationships
      const { data: currentClubAdmins } = await supabase
        .from('club_admins')
        .select('club_id')
        .eq('user_id', userId)
      
      const currentClubIds = (currentClubAdmins || []).map(ca => ca.club_id)
      
      // Calculate clubs to add and remove
      const clubsToAdd = formData.selectedClubAdmins.filter(clubId => !currentClubIds.includes(clubId))
      const clubsToRemove = currentClubIds.filter(clubId => !formData.selectedClubAdmins.includes(clubId))
      
      // Remove user from clubs
      if (clubsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('club_admins')
          .delete()
          .eq('user_id', userId)
          .in('club_id', clubsToRemove)
        
        if (removeError) throw removeError
      }
      
      // Add user to new clubs
      if (clubsToAdd.length > 0) {
        const newClubAdmins = clubsToAdd.map(clubId => ({
          user_id: parseInt(userId),
          club_id: clubId
        }))
        
        const { error: addError } = await supabase
          .from('club_admins')
          .insert(newClubAdmins)
        
        if (addError) throw addError
      }
      
      setSuccess("Usuario actualizado correctamente")
      
      // Refresh club admin data after changes
      const { data: updatedClubAdmins } = await supabase
        .from('club_admins')
        .select('club_id, user_id, club:club_id(id, name)')
        .eq('user_id', userId)
      
      console.log('Updated club admins data:', JSON.stringify(updatedClubAdmins, null, 2))
      
      // Transform the data to match our ClubAdmin interface using type assertion
      const transformedUpdatedClubAdmins: ClubAdmin[] = (updatedClubAdmins || []).map(item => {
        // Use type assertion to handle unknown shape
        const anyItem = item as any;
        const club_id = anyItem.club_id;
        const user_id = anyItem.user_id;
        
        // Handle club data safely
        let club = { id: 0, name: '' };
        
        if (anyItem.club) {
          if (Array.isArray(anyItem.club) && anyItem.club.length > 0) {
            club = {
              id: Number(anyItem.club[0].id) || 0,
              name: String(anyItem.club[0].name) || ''
            };
          } else {
            club = {
              id: Number(anyItem.club.id) || 0,
              name: String(anyItem.club.name) || ''
            };
          }
        }
        
        return {
          club_id,
          user_id,
          club
        };
      });
      
      setClubsAdmin(transformedUpdatedClubAdmins)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el usuario")
      console.error('Error updating user:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }))
    }
  }
  
  const toggleClubAdmin = (clubId: number) => {
    setFormData(prev => {
      if (prev.selectedClubAdmins.includes(clubId)) {
        return {
          ...prev,
          selectedClubAdmins: prev.selectedClubAdmins.filter(id => id !== clubId)
        }
      } else {
        return {
          ...prev,
          selectedClubAdmins: [...prev.selectedClubAdmins, clubId]
        }
      }
    })
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando datos del usuario...</p>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Usuario no encontrado</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/admin/usuarios")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista de usuarios
        </Button>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/usuarios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Usuario</h1>
          <p className="text-muted-foreground">Edita la información y permisos del usuario.</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Information Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    Club Principal
                  </label>
                  <Select
                    value={formData.club_id}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, club_id: value }))
                      if (validationErrors.club_id) {
                        setValidationErrors(prev => ({ ...prev, club_id: "" }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id.toString()}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        setFormData(prev => ({ ...prev, birth_gender: value }))
                        if (validationErrors.birth_gender) {
                          setValidationErrors(prev => ({ ...prev, birth_gender: "" }))
                        }
                      }}
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <label htmlFor="biography" className="text-sm font-medium">
                    Biografía
                  </label>
                  <Textarea
                    id="biography"
                    name="biography"
                    value={formData.biography}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Escribe una breve biografía del usuario..."
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Roles y Permisos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="page_admin" 
                    checked={formData.page_admin}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, page_admin: Boolean(checked) }))
                    }
                  />
                  <label
                    htmlFor="page_admin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Administrador del sitio
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Administrador de clubes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {clubs.map((club) => (
                      <div key={club.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`club-${club.id}`} 
                          checked={formData.selectedClubAdmins.includes(club.id)}
                          onCheckedChange={() => toggleClubAdmin(club.id)}
                        />
                        <label
                          htmlFor={`club-${club.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {club.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/usuarios")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </div>
        
        {/* User Profile Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.profile_picture || undefined} alt={`${formData.name} ${formData.surname}`} />
                <AvatarFallback className="bg-amber/10 text-amber-dark text-lg">
                  {formData.name.charAt(0)}{formData.surname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-bold">{formData.name} {formData.surname}</h3>
              <p className="text-sm text-muted-foreground mb-2">{formData.email}</p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                {formData.page_admin && (
                  <Badge variant="outline" className="border-amber bg-amber/10 text-amber-dark">
                    Administrador
                  </Badge>
                )}
                
                {formData.club_id && formData.club_id !== "none" && (
                  <Badge variant="outline">
                    {clubs.find(c => c.id.toString() === formData.club_id)?.name || 'Club'}
                  </Badge>
                )}
              </div>
              
              {formData.biography && (
                <div className="text-sm text-left mt-4 border-t pt-4">
                  <p className="font-medium mb-1">Biografía</p>
                  <p className="text-muted-foreground">{formData.biography}</p>
                </div>
              )}
              
              {formData.selectedClubAdmins.length > 0 && (
                <div className="text-sm text-left mt-4 border-t pt-4 w-full">
                  <p className="font-medium mb-1">Administrador de:</p>
                  <ul className="space-y-1">
                    {formData.selectedClubAdmins.map(clubId => {
                      const club = clubs.find(c => c.id === clubId)
                      return club ? (
                        <li key={club.id} className="text-muted-foreground">• {club.name}</li>
                      ) : null
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 