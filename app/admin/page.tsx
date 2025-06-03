"use client"

import Link from "next/link"
import { FileText, Home, Plus, Trophy, Users } from "lucide-react"
import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

// Type definitions for our stats
interface DashboardStats {
  usuarios: number
  usuariosNuevos: number
  usuariosNuevosHoy: number
  usuariosVerificados: number
  noticias: number
  noticiasEstesMes: number
  clubes: number
  clubesConContacto: number
  torneos: number
  torneosActivos: number
  torneosProximos: number
  crecimientoMensual: string
  loading: boolean
  error?: string
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    usuarios: 0,
    usuariosNuevos: 0,
    usuariosNuevosHoy: 0,
    usuariosVerificados: 0,
    noticias: 0,
    noticiasEstesMes: 0,
    clubes: 0,
    clubesConContacto: 0,
    torneos: 0,
    torneosActivos: 0,
    torneosProximos: 0,
    crecimientoMensual: "0%",
    loading: true,
  })

  // Load actual statistics from the new admin stats API
  useEffect(() => {
    async function loadStats() {
      try {
        setStats(prev => ({ ...prev, loading: true, error: undefined }))

        // Fetch statistics from the dedicated admin stats endpoint
        const statsData = await apiCall('/admin/stats')

        setStats({
          ...statsData,
          loading: false
        })
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load statistics'
        }))
      }
    }

    loadStats()
  }, [])

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          
        </div>
      </div>

      {stats.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error cargando estadísticas</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{stats.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {stats.loading ? "..." : stats.usuarios.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.loading ? "..." : stats.usuariosNuevos} nuevos este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {stats.loading ? "..." : stats.noticias.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.loading ? "..." : stats.noticiasEstesMes} este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Torneos activos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {stats.loading ? "..." : stats.torneosActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.loading ? "..." : stats.torneosProximos} próximos, {stats.loading ? "..." : stats.torneos} totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clubes registrados</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {stats.loading ? "..." : stats.clubes}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.loading ? "..." : stats.clubesConContacto} con información de contacto
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.loading ? (
                <div className="flex items-center space-x-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {stats.usuariosNuevosHoy > 0 ? 
                          `${stats.usuariosNuevosHoy} nuevo${stats.usuariosNuevosHoy > 1 ? 's' : ''} usuario${stats.usuariosNuevosHoy > 1 ? 's' : ''} registrado${stats.usuariosNuevosHoy > 1 ? 's' : ''} hoy` :
                          stats.usuariosNuevos > 0 ? "Nuevos usuarios este mes" : "Sistema inicializado"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.usuariosVerificados} usuarios verificados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {stats.noticiasEstesMes > 0 ? 
                          `${stats.noticiasEstesMes} noticia${stats.noticiasEstesMes > 1 ? 's' : ''} este mes` :
                          stats.noticias > 0 ? "Noticias disponibles" : "Sistema configurado"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Crecimiento: {stats.crecimientoMensual}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {stats.torneosActivos > 0 ? 
                          `${stats.torneosActivos} torneo${stats.torneosActivos > 1 ? 's' : ''} activo${stats.torneosActivos > 1 ? 's' : ''}` :
                          stats.torneosProximos > 0 ? `${stats.torneosProximos} torneos próximos` : "Torneos listos"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {stats.torneos} torneos
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:gap-4">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/usuarios/nuevo">
                  <Users className="mr-2 h-4 w-4" />
                  Nuevo usuario
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/noticias/nueva">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva noticia
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/torneos/nuevo">
                  <Trophy className="mr-2 h-4 w-4" />
                  Nuevo torneo
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/clubes/nuevo">
                  <Home className="mr-2 h-4 w-4" />
                  Nuevo club
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

