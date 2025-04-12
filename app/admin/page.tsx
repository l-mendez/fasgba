"use client"

import Link from "next/link"
import { ArrowUpRight, BarChart3, Calendar, FileText, Home, MessageSquare, Plus, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "../components/auth-guard"
import { getSupabaseClient, ensureSession } from "@/lib/supabase-client"

export default function AdminDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const hasSession = await ensureSession()
        if (!hasSession) {
          router.push('/login?redirectedFrom=/admin')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/login?redirectedFrom=/admin')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [router])

  // Datos de ejemplo para las estadísticas
  const stats = [
    {
      title: "Total Usuarios",
      value: "1,234",
      change: "+12%",
      changeType: "increase",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Clubes Afiliados",
      value: "15",
      change: "+2",
      changeType: "increase",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Torneos Activos",
      value: "8",
      change: "+3",
      changeType: "increase",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Comentarios",
      value: "342",
      change: "+24%",
      changeType: "increase",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  // Datos de ejemplo para actividad reciente
  const recentActivity = [
    {
      type: "noticia",
      title: "Nueva entidad se suma a FASGBA: Club Patriotas de Punta Alta",
      date: "Hace 2 horas",
      user: "Carlos Martínez",
    },
    {
      type: "torneo",
      title: "Actualización: Gran Prix FASGBA 2025",
      date: "Hace 5 horas",
      user: "Laura Gómez",
    },
    {
      type: "usuario",
      title: "Nuevo usuario registrado: Martín López",
      date: "Hace 1 día",
      user: "Sistema",
    },
    {
      type: "comentario",
      title: "Comentario eliminado en 'Ajedrez por la memoria verdad y justicia'",
      date: "Hace 1 día",
      user: "Roberto Sánchez",
    },
    {
      type: "club",
      title: "Actualización de datos: Club de Ajedrez Bahía Blanca",
      date: "Hace 2 días",
      user: "Carlos Martínez",
    },
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Entidad
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className="text-muted-foreground">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === "increase" ? "text-green-500" : "text-red-500"}`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-muted rounded-full">
                      {activity.type === "noticia" ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.date} • {activity.user}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra usuarios, roles y permisos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Todos los Usuarios
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nuevo Usuario
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Clubes</CardTitle>
              <CardDescription>
                Administra clubes y sus configuraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Ver Todos los Clubes
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Nuevo Club
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
              <CardDescription>
                Visualiza datos y métricas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Estadísticas Generales
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Reportes Personalizados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}

