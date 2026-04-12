"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { apiCall } from "@/lib/utils/apiClient"
import { useAuth } from "@/hooks/useAuth"

interface Club {
  id: number
  name: string
}

interface Player {
  id: number
  full_name: string
  fide_id: string | null
  rating: number | null
  club: {
    id: number
    name: string
  } | null
}

interface PlayerFormData {
  full_name: string
  fide_id: string
  rating: string
  club_id: string
}

export default function EditarJugadorPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string
  const { user, isAdmin, isClubAdmin, isLoading: authLoading } = useAuth()
  
  const [player, setPlayer] = useState<Player | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [adminClubs, setAdminClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  
  const [formData, setFormData] = useState<PlayerFormData>({
    full_name: "",
    fide_id: "",
    rating: "",
    club_id: "none",
  })

  // Check permissions and fetch data
  useEffect(() => {
    const checkPermissionsAndFetchData = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (!isAdmin && !isClubAdmin) {
        toast.error('No tienes permisos para editar jugadores')
        router.push('/')
        return
      }

      try {
        setIsLoading(true)
        
        // Fetch player data
        const playerData = await apiCall(`/api/players/${playerId}`)
        setPlayer(playerData)
        
        // Set form data
        setFormData({
          full_name: playerData.full_name,
          fide_id: playerData.fide_id || "",
          rating: playerData.rating?.toString() || "",
          club_id: playerData.club?.id.toString() || "none",
        })

        // Fetch clubs based on user permissions
        if (isAdmin) {
          // Site admins can see all clubs
          const clubsData = await apiCall('/api/clubs')
          setClubs(clubsData.clubs || [])
          setCanEdit(true) // Site admins can edit any player
        } else if (isClubAdmin) {
          // Club admins can only see their clubs
          const adminClubsData = await apiCall('/api/users/me/admin-clubs')
          const userClubs: Club[] = (adminClubsData || []).map((item: any) => item.clubs || item).filter(Boolean)
          setAdminClubs(userClubs)
          setClubs(userClubs)

          // Check if club admin can edit this player
          // They can edit if: player has no club OR player belongs to one of their clubs
          const playerClubId = playerData.club?.id
          const canEditPlayer = !playerClubId || userClubs.some(club => club.id === playerClubId)
          setCanEdit(canEditPlayer)

          if (!canEditPlayer) {
            toast.error('No tienes permisos para editar este jugador')
            router.push('/club-admin')
            return
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar datos del jugador')
        router.push(isAdmin ? '/admin/jugadores' : '/club-admin')
      } finally {
        setIsLoading(false)
      }
    }

    if (playerId) {
      checkPermissionsAndFetchData()
    }
  }, [user, isAdmin, isClubAdmin, authLoading, router, playerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name.trim()) {
      toast.error('El nombre completo es requerido')
      return
    }

    // If user is club admin, they can only assign players to their clubs
    if (!isAdmin && isClubAdmin && formData.club_id && formData.club_id !== "none") {
      const clubId = parseInt(formData.club_id)
      const canAssignToClub = adminClubs.some(club => club.id === clubId)
      if (!canAssignToClub) {
        toast.error('No tienes permisos para asignar jugadores a este club')
        return
      }
    }

    try {
      setIsSubmitting(true)
      
      const payload = {
        full_name: formData.full_name.trim(),
        fide_id: formData.fide_id.trim() || null,
        rating: formData.rating ? parseInt(formData.rating) : null,
        club_id: formData.club_id && formData.club_id !== "none" ? parseInt(formData.club_id) : null,
      }

      await apiCall(`/api/players/${playerId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      toast.success('Jugador actualizado exitosamente')
      
      // Redirect based on user type
      if (isAdmin) {
        router.push('/admin/jugadores')
      } else {
        router.push('/club-admin')
      }
    } catch (error: any) {
      console.error('Error updating player:', error)
      const errorMessage = error.message || 'Error al actualizar jugador'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      await apiCall(`/api/players/${playerId}`, {
        method: 'DELETE',
      })

      toast.success('Jugador eliminado exitosamente')
      
      // Redirect based on user type
      if (isAdmin) {
        router.push('/admin/jugadores')
      } else {
        router.push('/club-admin')
      }
    } catch (error: any) {
      console.error('Error deleting player:', error)
      const errorMessage = error.message || 'Error al eliminar jugador'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!player || !canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p>Jugador no encontrado o sin permisos para editar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href={isAdmin ? "/admin/jugadores" : "/club-admin"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Editar Jugador</h1>
          <p className="text-muted-foreground">
            Modifica la información del jugador
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Información del Jugador
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? "Como administrador del sitio, puedes editar cualquier jugador."
              : "Como administrador de club, puedes editar jugadores sin club o de los clubes que administras."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ingresa el nombre completo del jugador"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fide_id">FIDE ID</Label>
              <Input
                id="fide_id"
                value={formData.fide_id}
                onChange={(e) => setFormData({ ...formData, fide_id: e.target.value })}
                placeholder="Opcional - ID de FIDE del jugador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="4000"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                placeholder="Opcional - Rating del jugador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club_id">Club</Label>
              <Select 
                value={formData.club_id} 
                onValueChange={(value) => setFormData({ ...formData, club_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin club</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isAdmin && clubs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No administras ningún club actualmente.
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Jugador
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el jugador{" "}
                      <strong>{player.full_name}</strong> del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        'Eliminar'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex space-x-2">
                <Link href={isAdmin ? "/admin/jugadores" : "/club-admin"}>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="bg-terracotta hover:bg-terracotta/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar Jugador
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 