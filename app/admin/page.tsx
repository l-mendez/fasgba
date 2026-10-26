import { Suspense } from "react"
import Link from "next/link"
import { FileText, FolderOpen, Home, Trophy, UserCog, Users } from "lucide-react"

import { PurgeCacheMenu } from "./purge-cache-menu"
import { ChessResultsImportButton } from "@/components/chess-results/chess-results-import-button"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import { requireAdminAction } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Create shortcuts only; icons match the sidebar.
const QUICK_ACTIONS = [
  { href: "/torneos/nuevo", label: "Nuevo torneo", icon: Trophy },
  { href: "/admin/clubes/nuevo", label: "Nuevo club", icon: Home },
  { href: "/noticias/nueva?source=admin", label: "Nueva noticia", icon: FileText },
  { href: "/jugadores/nuevo", label: "Nuevo jugador", icon: Users },
  { href: "/admin/documentos", label: "Nuevo documento", icon: FolderOpen },
]

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

// Type definitions for our stats
interface DashboardStats {
  usuarios: number
  usuariosNuevos: number
  noticias: number
  noticiasEstesMes: number
  clubes: number
  clubesConContacto: number
  torneos: number
  torneosActivos: number
  torneosProximos: number
}

// Server-side function to fetch dashboard statistics
async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdminAction()

  try {
    const supabase = createAdminClient()
    
    // Get current date information
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
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

    const authUsers = usersResult.data.users || []
    const totalUsers = authUsers.length
    const newUsersThisMonth = authUsers.filter((user) => new Date(user.created_at) >= startOfMonth).length

    return {
      usuarios: totalUsers,
      usuariosNuevos: newUsersThisMonth,
      noticias: newsCount.count || 0,
      noticiasEstesMes: newsThisMonth.count || 0,
      clubes: clubsCount.count || 0,
      clubesConContacto: clubsWithContact.count || 0,
      torneos: tournamentsCount.count || 0,
      torneosActivos: countUniqueTournamentIds(activeTournaments.data),
      torneosProximos: countUniqueTournamentIds(upcomingTournaments.data),
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if there's an error
    return {
      usuarios: 0,
      usuariosNuevos: 0,
      noticias: 0,
      noticiasEstesMes: 0,
      clubes: 0,
      clubesConContacto: 0,
      torneos: 0,
      torneosActivos: 0,
      torneosProximos: 0,
    }
  }
}

function countUniqueTournamentIds(rows: Array<{ tournament_id: number | null }> | null): number {
  return new Set(rows?.map((row) => row.tournament_id).filter(Boolean)).size
}

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-6">
      <AdminPageHeader title="Panel" />
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
            <UserCog className="h-4 w-4 text-amber" />
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
            <FileText className="h-4 w-4 text-amber" />
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
            <Trophy className="h-4 w-4 text-amber" />
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
            <Home className="h-4 w-4 text-amber" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Button key={href} asChild className="w-full justify-start" variant="outline">
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
            <ChessResultsImportButton chooseClub className="justify-start sm:w-full" />
            <PurgeCacheMenu />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
