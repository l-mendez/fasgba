import { Suspense } from "react"
import Link from "next/link"
import { Award, FileText, FolderOpen, GraduationCap, Home, Shield, Trophy, Users } from "lucide-react"

import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import { requireAdminAction } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

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
  await requireAdminAction()

  try {
    const supabase = createAdminClient()
    
    // Get current date information
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const today = getArgentinaDateInputValue(now)
    
    // Fetch all statistics in parallel
    const [
      usersResult,
      newsCount,
      newsThisMonth,
      clubsCount,
      clubsWithContact,
      tournamentsCount,
      activeTournaments,
      upcomingTournaments
    ] = await Promise.all([
      // Auth users are stored in Supabase Auth, not in a public profiles table.
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      
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
      
      // Tournaments with an event date today
      supabase
        .from('tournamentdates')
        .select('tournament_id')
        .eq('event_date', today),
      
      // Upcoming tournament dates
      supabase
        .from('tournamentdates')
        .select('tournament_id')
        .gte('event_date', today)
    ])

    if (usersResult.error) {
      throw usersResult.error
    }

    // Calculate growth percentage
    const authUsers = usersResult.data.users || []
    const totalUsers = authUsers.length
    const newUsersThisMonth = authUsers.filter((user) => new Date(user.created_at) >= startOfMonth).length
    const newUsersToday = authUsers.filter((user) => new Date(user.created_at) >= startOfToday).length
    const verifiedUsers = authUsers.filter((user) => Boolean(user.email_confirmed_at)).length
    const growthRate = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : "0"

    return {
      usuarios: totalUsers,
      usuariosNuevos: newUsersThisMonth,
      usuariosNuevosHoy: newUsersToday,
      usuariosVerificados: verifiedUsers,
      noticias: newsCount.count || 0,
      noticiasEstesMes: newsThisMonth.count || 0,
      clubes: clubsCount.count || 0,
      clubesConContacto: clubsWithContact.count || 0,
      torneos: tournamentsCount.count || 0,
      torneosActivos: countUniqueTournamentIds(activeTournaments.data),
      torneosProximos: countUniqueTournamentIds(upcomingTournaments.data),
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

function countUniqueTournamentIds(rows: Array<{ tournament_id: number | null }> | null): number {
  return new Set(rows?.map((row) => row.tournament_id).filter(Boolean)).size
}

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4">
      <AdminPageHeader title="Dashboard" />
      <Suspense fallback={<AdminContentSkeleton stats={4} rows={3} filters={false} />}>
        <AdminDashboardContent />
      </Suspense>
    </div>
  )
}

async function AdminDashboardContent() {
  const stats = await getDashboardStats()

  return (
    <>
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
            <div className="grid gap-2 md:gap-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/torneos/nuevo">
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
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/ranking">
                  <Trophy className="mr-2 h-4 w-4" />
                  Gestionar ranking
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/noticias/nueva?source=admin">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva noticia
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/jugadores">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar jugadores
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/equipos">
                  <Shield className="mr-2 h-4 w-4" />
                  Gestionar equipos
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/documentos">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Agregar documento nuevo
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/alumnos">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Gestionar alumnos
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/arbitros">
                  <Award className="mr-2 h-4 w-4" />
                  Gestionar árbitros
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
