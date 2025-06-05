"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

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
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

interface UserEditFormProps {
  user: UserWithPermissions
  clubs: Club[]
  clubsAdmin: ClubAdmin[]
}

export function UserEditForm({ user, clubs, clubsAdmin }: UserEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data state for permissions
  const [permissions, setPermissions] = useState({
    isAdmin: user.isAdmin,
    selectedClubAdmins: clubsAdmin.map(ca => ca.club_id),
  })

  const handlePermissionsSubmit = async () => {
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
        const supabase = createClient()
        const { error: adminInsertError } = await supabase
          .from('admins')
          .upsert({ auth_id: user.id })
        
        if (adminInsertError) throw adminInsertError
      } else if (!permissions.isAdmin && user.isAdmin) {
        // Remove from admins table
        const supabase = createClient()
        const { error: adminDeleteError } = await supabase
          .from('admins')
          .delete()
          .eq('auth_id', user.id)
        
        if (adminDeleteError) throw adminDeleteError
      }
      
      // 2. Update club admin relationships
      const supabase = createClient()
      const { data: currentClubAdmins } = await supabase
        .from('club_admins')
        .select('club_id')
        .eq('auth_id', user.id)
      
      const currentClubIds = (currentClubAdmins || []).map((ca: any) => ca.club_id)
      
      const clubsToAdd = permissions.selectedClubAdmins.filter((clubId: number) => !currentClubIds.includes(clubId))
      const clubsToRemove = currentClubIds.filter((clubId: any) => !permissions.selectedClubAdmins.includes(clubId))
      
      // Remove user from clubs
      if (clubsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('club_admins')
          .delete()
          .eq('auth_id', user.id)
          .in('club_id', clubsToRemove)
        
        if (removeError) throw removeError
      }
      
      // Add user to new clubs
      if (clubsToAdd.length > 0) {
        const newClubAdmins = clubsToAdd.map(clubId => ({
          auth_id: user.id,
          club_id: clubId
        }))
        
        const { error: addError } = await supabase
          .from('club_admins')
          .insert(newClubAdmins)
        
        if (addError) throw addError
      }
      
      setSuccess("Permisos actualizados correctamente")
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar los permisos")
      console.error('Error updating permissions:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBanUser = async () => {
    if (!confirm('¿Estás seguro de que quieres suspender a este usuario?')) return
    
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
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
      <div className="flex items-center gap-2 md:gap-4">
        <Button onClick={() => router.push("/admin/usuarios")} size="sm" className="md:h-10">
          ←
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-terracotta">Administrar Usuario</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestiona permisos y acceso del usuario.</p>
        </div>
      </div>
      
      {error && (
        <Alert>
          <span className="text-red-600 mr-2">⚠️</span>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-700">
          <span className="text-green-600 mr-2">✓</span>
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription className="text-sm">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* User Information Display */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          
          {/* User Identity Card */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Nombre completo</label>
                  <p className="text-xs md:text-sm bg-muted p-2 rounded">
                    {user.nombre && user.apellido 
                      ? `${user.nombre} ${user.apellido}`
                      : user.nombre || user.apellido || (
                        <span className="text-muted-foreground italic">Sin nombre registrado</span>
                      )
                    }
                  </p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-xs md:text-sm font-mono bg-muted p-2 rounded break-all">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">UID</label>
                  <p className="text-xs md:text-sm font-mono bg-muted p-2 rounded break-all">{user.id}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Email Verificado</label>
                  <div className="mt-1">
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Verificado</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 text-xs">No verificado</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Último acceso</label>
                  <p className="text-xs md:text-sm">{formatDate(user.lastSignIn)}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Fecha de registro</label>
                  <p className="text-xs md:text-sm">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Management */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Gestión de Permisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isAdmin" 
                  checked={permissions.isAdmin}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setPermissions(prev => ({ ...prev, isAdmin: Boolean(checked) }))
                  }
                  className="h-5 w-5 md:h-4 md:w-4"
                />
                <label htmlFor="isAdmin" className="text-sm md:text-sm font-medium leading-relaxed">
                  Administrador del sitio
                </label>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Administrador de clubes</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`club-${club.id}`} 
                        checked={permissions.selectedClubAdmins.includes(club.id)}
                        onCheckedChange={() => toggleClubAdmin(club.id)}
                        className="h-5 w-5 md:h-4 md:w-4"
                      />
                      <label htmlFor={`club-${club.id}`} className="text-sm leading-relaxed">
                        {club.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handlePermissionsSubmit} 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? "Guardando..." : "Guardar permisos"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Moderation Actions */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl text-red-600">Acciones de Moderación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/50 p-3 md:p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 text-sm md:text-base">Suspender Usuario</h4>
                <p className="text-xs md:text-sm text-red-700 dark:text-red-300 mb-3">
                  El usuario no podrá acceder al sistema hasta que se reactive su cuenta.
                </p>
                <Button 
                  onClick={handleBanUser}
                  disabled={isSubmitting}
                  className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white w-full md:w-auto"
                  size="sm"
                >
                  Suspender Usuario
                </Button>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/50 p-3 md:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 text-sm md:text-base">Timeout Temporal</h4>
                <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Suspender temporalmente al usuario por 24 horas.
                </p>
                <Button 
                  variant="outline"
                  className="border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 w-full md:w-auto"
                  disabled={true}
                  size="sm"
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