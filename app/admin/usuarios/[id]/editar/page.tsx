"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"

interface Club {
  id: number
  name: string
}

interface UserWithPermissions {
  id: string
  email: string
  emailVerified: boolean
  lastSignIn: string | null
  createdAt: string
  nombre?: string
  apellido?: string
  isAdmin: boolean
  isClubAdmin: boolean
  adminClubs: string[]
}

interface ClubAdmin {
  club_id: number
  auth_id: string
  club: {
    id: number
    name: string
  }
}

// API utility functions
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json()
  
  if (data && typeof data === 'object' && data.error) {
    throw new Error(data.error)
  }
  
  return data
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserWithPermissions | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsAdmin, setClubsAdmin] = useState<ClubAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data state for permissions
  const [permissions, setPermissions] = useState({
    isAdmin: false,
    selectedClubAdmins: [] as number[],
  })

  // Fetch user data and clubs
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch all users and find the specific one
        const users = await apiCall('/api/auth/users')
        
        if (!Array.isArray(users)) {
          console.error('API response is not an array:', users)
          throw new Error('Invalid response from user API')
        }
        
        const userData = users.find((u: UserWithPermissions) => u.id === userId)
        
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
          .select(`
            club_id, 
            auth_id, 
            club:clubs(id, name)
          `)
          .eq('auth_id', userId)
        
        if (clubAdminsError) throw clubAdminsError
        
        const transformedClubAdmins: ClubAdmin[] = (clubAdminsData || []).map((item: any) => ({
          club_id: item.club_id,
          auth_id: item.auth_id,
          club: {
            id: item.club?.id || 0,
            name: item.club?.name || ''
          }
        }))
        
        setClubsAdmin(transformedClubAdmins)
        
        // Set initial permissions
        setPermissions({
          isAdmin: userData.isAdmin,
          selectedClubAdmins: (clubAdminsData || []).map((ca: any) => ca.club_id),
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del usuario"
        setError(errorMessage)
        console.error('Error loading user data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (userId) {
      fetchData()
    }
  }, [userId])
  
  const handlePermissionsSubmit = async () => {
    if (!user) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      // 1. Update admin permissions
      if (permissions.isAdmin && !user.isAdmin) {
        // Add to admins table
        const { error: adminInsertError } = await supabase
          .from('admins')
          .upsert({ auth_id: userId })
        
        if (adminInsertError) throw adminInsertError
      } else if (!permissions.isAdmin && user.isAdmin) {
        // Remove from admins table
        const { error: adminDeleteError } = await supabase
          .from('admins')
          .delete()
          .eq('auth_id', userId)
        
        if (adminDeleteError) throw adminDeleteError
      }
      
      // 2. Update club admin relationships
      const { data: currentClubAdmins } = await supabase
        .from('club_admins')
        .select('club_id')
        .eq('auth_id', userId)
      
      const currentClubIds = (currentClubAdmins || []).map((ca: any) => ca.club_id)
      
      const clubsToAdd = permissions.selectedClubAdmins.filter((clubId: number) => !currentClubIds.includes(clubId))
      const clubsToRemove = currentClubIds.filter((clubId: any) => !permissions.selectedClubAdmins.includes(clubId))
      
      // Remove user from clubs
      if (clubsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('club_admins')
          .delete()
          .eq('auth_id', userId)
          .in('club_id', clubsToRemove)
        
        if (removeError) throw removeError
      }
      
      // Add user to new clubs
      if (clubsToAdd.length > 0) {
        const newClubAdmins = clubsToAdd.map(clubId => ({
          auth_id: userId,
          club_id: clubId
        }))
        
        const { error: addError } = await supabase
          .from('club_admins')
          .insert(newClubAdmins)
        
        if (addError) throw addError
      }
      
      setSuccess("Permisos actualizados correctamente")
      
      // Update user state
      setUser(prev => prev ? {
        ...prev,
        isAdmin: permissions.isAdmin,
        isClubAdmin: permissions.selectedClubAdmins.length > 0
      } : null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar los permisos")
      console.error('Error updating permissions:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBanUser = async () => {
    if (!user || !confirm('¿Estás seguro de que quieres suspender a este usuario?')) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // TODO: Implement user ban functionality
      // This would typically involve calling Supabase Auth admin API to disable the user
      setError("Funcionalidad de suspensión no implementada aún")
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al suspender el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleClubAdmin = (clubId: number) => {
    setPermissions(prev => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta"></div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert>
          <span className="text-red-600 mr-2">⚠️</span>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Usuario no encontrado</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/admin/usuarios")}>
          ← Volver a la lista de usuarios
        </Button>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push("/admin/usuarios")}>
          ←
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Administrar Usuario</h1>
          <p className="text-muted-foreground">Gestiona permisos y acceso del usuario.</p>
        </div>
      </div>
      
      {error && (
        <Alert>
          <span className="text-red-600 mr-2">⚠️</span>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-700">
          <span className="text-green-600 mr-2">✓</span>
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Information Display */}
        <div className="md:col-span-2 space-y-6">
          
          {/* User Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">UID</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">{user.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Verificado</label>
                  <div className="mt-1">
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">No verificado</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Último acceso</label>
                  <p className="text-sm">{formatDate(user.lastSignIn)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de registro</label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Permisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isAdmin" 
                  checked={permissions.isAdmin}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setPermissions(prev => ({ ...prev, isAdmin: Boolean(checked) }))
                  }
                />
                <label htmlFor="isAdmin" className="text-sm font-medium">
                  Administrador del sitio
                </label>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Administrador de clubes</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`club-${club.id}`} 
                        checked={permissions.selectedClubAdmins.includes(club.id)}
                        onCheckedChange={() => toggleClubAdmin(club.id)}
                      />
                      <label htmlFor={`club-${club.id}`} className="text-sm">
                        {club.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handlePermissionsSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar permisos"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Moderation Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Acciones de Moderación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Suspender Usuario</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  El usuario no podrá acceder al sistema hasta que se reactive su cuenta.
                </p>
                <Button 
                  onClick={handleBanUser}
                  disabled={isSubmitting}
                  className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white"
                >
                  Suspender Usuario
                </Button>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Timeout Temporal</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Suspender temporalmente al usuario por 24 horas.
                </p>
                <Button 
                  variant="outline"
                  className="border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                  disabled={true}
                >
                  Timeout 24h (Próximamente)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 