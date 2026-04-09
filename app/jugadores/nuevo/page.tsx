"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Users } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { apiCall } from "@/lib/utils/apiClient"
import { useAuth } from "@/hooks/useAuth"

interface Club {
  id: number
  name: string
}

interface PlayerFormData {
  full_name: string
  fide_id: string
  rating: string
  club_id: string
}

export default function NuevoJugadorPage() {
  const router = useRouter()
  const { user, isAdmin, isClubAdmin, isLoading: authLoading } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [adminClubs, setAdminClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
        toast.error('No tienes permisos para crear jugadores')
        router.push('/')
        return
      }

      try {
        setIsLoading(true)
        
        if (isAdmin) {
          // Site admins can see all clubs
          const clubsData = await apiCall('/api/clubs')
          setClubs(clubsData.clubs || [])
        } else if (isClubAdmin) {
          // Club admins can only see their clubs
          const adminClubsData = await apiCall('/api/users/me/admin-clubs')
          const adminClubs = (adminClubsData || []).map((item: any) => item.clubs || item).filter(Boolean)
          setAdminClubs(adminClubs)
          setClubs(adminClubs)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissionsAndFetchData()
  }, [user, isAdmin, isClubAdmin, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name.trim()) {
      toast.error('El nombre completo es requerido')
      return
    }

    // If user is club admin, they can only create players for their clubs
    if (!isAdmin && isClubAdmin && formData.club_id) {
      const clubId = parseInt(formData.club_id)
      const canCreateForClub = adminClubs.some(club => club.id === clubId)
      if (!canCreateForClub) {
        toast.error('No tienes permisos para crear jugadores en este club')
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

      await apiCall('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      toast.success('Jugador creado exitosamente')
      
      // Redirect based on user type
      if (isAdmin) {
        router.push('/admin/jugadores')
      } else {
        router.push('/club-admin')
      }
    } catch (error: any) {
      console.error('Error creating player:', error)
      const errorMessage = error.message || 'Error al crear jugador'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nuevo Jugador</h1>
          <p className="text-muted-foreground">
            Completa el formulario para agregar un nuevo jugador
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
              ? "Como administrador del sitio, puedes crear jugadores para cualquier club."
              : "Como administrador de club, puedes crear jugadores para los clubes que administras."
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

            <div className="flex justify-end space-x-2 pt-4">
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
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Jugador
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 