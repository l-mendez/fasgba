"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, CalendarPlus, ChevronLeft, CircleDashed, Fingerprint, Loader2, LogIn, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoPill } from "@/components/info-pill"
import { apiCall } from "@/lib/utils/apiClient"

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

interface UserEditFormProps {
  user: UserWithPermissions
  clubs: Club[]
  clubsAdmin: ClubAdmin[]
}

export function UserEditForm({ user, clubs, clubsAdmin }: UserEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [permissions, setPermissions] = useState({
    isAdmin: user.isAdmin,
    selectedClubAdmins: clubsAdmin.map(ca => ca.club_id),
  })

  const handlePermissionsSubmit = async () => {
    try {
      setIsSubmitting(true)

      await apiCall(`/api/admin/users/${user.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          isAdmin: permissions.isAdmin,
          clubAdminIds: permissions.selectedClubAdmins,
        }),
      })

      toast.success("Permisos actualizados")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar los permisos")
      console.error('Error updating permissions:', err)
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

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(" ")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => router.push("/admin/usuarios")}
          variant="outline"
          size="icon"
          aria-label="Volver a usuarios"
          title="Volver a usuarios"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight text-terracotta md:text-3xl">
          {fullName || user.email}
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-1.5 p-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-amber" />
            <span className="break-all text-foreground">{user.email}</span>
            {user.emailVerified ? (
              <InfoPill icon={BadgeCheck}>Verificado</InfoPill>
            ) : (
              <InfoPill icon={CircleDashed}>No verificado</InfoPill>
            )}
          </div>
          <div className="flex items-center gap-2" title="UID">
            <Fingerprint className="h-4 w-4 shrink-0 text-amber" />
            <span className="break-all font-mono text-xs">{user.id}</span>
          </div>
          <div className="flex items-center gap-2" title="Último acceso">
            <LogIn className="h-4 w-4 shrink-0 text-amber" />
            <span>{formatDate(user.lastSignIn)}</span>
          </div>
          <div className="flex items-center gap-2" title="Fecha de registro">
            <CalendarPlus className="h-4 w-4 shrink-0 text-amber" />
            <span>{formatDate(user.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg">Permisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={permissions.isAdmin}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setPermissions(prev => ({ ...prev, isAdmin: Boolean(checked) }))
              }
              className="h-5 w-5 md:h-4 md:w-4"
            />
            <label htmlFor="isAdmin" className="text-sm font-medium">
              Administrador del sitio
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Delegado de clubes</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club) => (
                <div key={club.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`club-${club.id}`}
                    checked={permissions.selectedClubAdmins.includes(club.id)}
                    onCheckedChange={() => toggleClubAdmin(club.id)}
                    className="h-5 w-5 md:h-4 md:w-4"
                  />
                  <label htmlFor={`club-${club.id}`} className="text-sm">
                    {club.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              onClick={handlePermissionsSubmit}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar permisos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
