"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, FileText, MessageSquare, Plus, Trophy, TrendingUp, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useClubContext } from "./context/club-context" 
import { AuthGuard } from "../components/auth-guard"
import { getSupabaseClient, ensureSession } from "@/lib/supabase-client"

export default function ClubAdminDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const { selectedClub, isLoading: clubContextLoading } = useClubContext()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const hasSession = await ensureSession()
        if (!hasSession) {
          router.push('/login?redirectedFrom=/club-admin')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/login?redirectedFrom=/club-admin')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [router])

  const [stats, setStats] = useState({
    miembros: 0,
    miembrosNuevos: 0,
    noticias: 0,
    torneos: 0,
    torneosActivos: 0,
  })

  // Simular carga de estadísticas cuando cambia el club seleccionado
  useEffect(() => {
    if (!selectedClub) return

    // En una aplicación real, aquí se cargarían los datos del club seleccionado
    setStats({
      miembros: Math.floor(Math.random() * 100) + 50,
      miembrosNuevos: Math.floor(Math.random() * 10) + 1,
      noticias: Math.floor(Math.random() * 30) + 5,
      torneos: Math.floor(Math.random() * 20) + 3,
      torneosActivos: Math.floor(Math.random() * 5) + 1,
    })
  }, [selectedClub])

  // Datos de ejemplo para las tarjetas
  const ultimosMiembros = [
    {
      id: 1,
      nombre: "Carlos Rodríguez",
      fechaRegistro: "Hace 2 días",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      nombre: "María Fernández",
      fechaRegistro: "Hace 3 días",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      nombre: "Juan Pérez",
      fechaRegistro: "Hace 5 días",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const proximosTorneos = [
    {
      id: 1,
      nombre: "Torneo Rápido de Primavera",
      fecha: "15/10/2023",
      estado: "Inscripciones abiertas",
    },
    {
      id: 2,
      nombre: "Campeonato Interno",
      fecha: "22/10/2023",
      estado: "Próximamente",
    },
  ]

  const ultimasNoticias = [
    {
      id: 1,
      titulo: "Gran actuación en el Torneo Metropolitano",
      fecha: "Hace 1 día",
    },
    {
      id: 2,
      titulo: "Clases de ajedrez para principiantes",
      fecha: "Hace 3 días",
    },
    {
      id: 3,
      titulo: "Resultados del Torneo Relámpago",
      fecha: "Hace 5 días",
    },
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <AuthGuard requiredRole="club-admin">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración de Club</h1>
            <p className="text-muted-foreground">
              {selectedClub ? `Administrando: ${selectedClub.nombre}` : "Selecciona un club para administrar"}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Noticia
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Miembros Totales
              </CardTitle>
              <div className="text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.miembros}</div>
              <p className="text-xs text-green-500">
                +{stats.miembrosNuevos} nuevos este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Noticias Publicadas
              </CardTitle>
              <div className="text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.noticias}</div>
              <p className="text-xs text-muted-foreground">
                En los últimos 30 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Torneos Totales
              </CardTitle>
              <div className="text-muted-foreground">
                <Trophy className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.torneos}</div>
              <p className="text-xs text-muted-foreground">
                Desde el inicio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Torneos Activos
              </CardTitle>
              <div className="text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.torneosActivos}</div>
              <p className="text-xs text-muted-foreground">
                En curso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Crecimiento
              </CardTitle>
              <div className="text-muted-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{Math.floor(Math.random() * 15) + 5}%</div>
              <p className="text-xs text-muted-foreground">
                Respecto al mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Members */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Últimos Miembros Registrados</CardTitle>
            <CardDescription>
              Miembros que se han unido recientemente al club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimosMiembros.map((miembro) => (
                <div key={miembro.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={miembro.avatar} alt={miembro.nombre} />
                      <AvatarFallback>{miembro.nombre.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{miembro.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {miembro.fechaRegistro}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Ver Todos los Miembros
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Miembros</CardTitle>
              <CardDescription>
                Administra los miembros del club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Todos los Miembros
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Nuevo Miembro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Noticias</CardTitle>
              <CardDescription>
                Administra las noticias del club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ver Todas las Noticias
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nueva Noticia
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Torneos</CardTitle>
              <CardDescription>
                Administra los torneos del club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Todos los Torneos
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nuevo Torneo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}

