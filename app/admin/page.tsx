import Link from "next/link"
import { FileText, Home, Plus, Trophy, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

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
}

// Server-side function to fetch dashboard statistics
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient()
    
    // Get current date information
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Fetch all statistics in parallel
    const [
      usersCount,
      usersThisMonth,
      usersToday,
      verifiedUsers,
      newsCount,
      newsThisMonth,
      clubsCount,
      clubsWithContact,
      tournamentsCount,
      activeTournaments,
      upcomingTournaments
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      
      // Users this month
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // Users today
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),
      
      // Verified users (assuming email_verified field exists)
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true),
      
      // Total news
      supabase.from('news').select('*', { count: 'exact', head: true }),
      
      // News this month
      supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // Total clubs
      supabase.from('clubs').select('*', { count: 'exact', head: true }),
      
      // Clubs with contact info
      supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true })
        .or('mail.neq.null,telephone.neq.null'),
      
      // Total tournaments
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      
      // Active tournaments (assuming status field exists)
      supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Upcoming tournaments
      supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', now.toISOString())
    ])

    // Calculate growth percentage
    const totalUsers = usersCount.count || 0
    const newUsersThisMonth = usersThisMonth.count || 0
    const growthRate = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : "0"

    return {
      usuarios: totalUsers,
      usuariosNuevos: newUsersThisMonth,
      usuariosNuevosHoy: usersToday.count || 0,
      usuariosVerificados: verifiedUsers.count || 0,
      noticias: newsCount.count || 0,
      noticiasEstesMes: newsThisMonth.count || 0,
      clubes: clubsCount.count || 0,
      clubesConContacto: clubsWithContact.count || 0,
      torneos: tournamentsCount.count || 0,
      torneosActivos: activeTournaments.count || 0,
      torneosProximos: upcomingTournaments.count || 0,
      crecimientoMensual: `${growthRate}%`
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if there's an error
    return {
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
      crecimientoMensual: "0%"
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">
              {stats.usuarios.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.usuariosNuevos} nuevos este mes
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
              {stats.noticias.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.noticiasEstesMes} este mes
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
              {stats.torneosActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.torneosProximos} próximos, {stats.torneos} totales
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
              {stats.clubes}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.clubesConContacto} con información de contacto
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

