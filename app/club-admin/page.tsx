"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, FileText, MessageSquare, Plus, Trophy, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ClubAdminDashboard() {
  const [stats, setStats] = useState({
    noticias: 0,
    torneos: 0,
    torneosActivos: 0,
  })
  const [loading, setLoading] = useState(true)

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Replace with actual API call when available
        // const response = await fetch('/api/club/stats')
        // const data = await response.json()
        // setStats(data)
        
        // For now, simulate with client-side only random data
        setStats({
          noticias: Math.floor(Math.random() * 30) + 5,
          torneos: Math.floor(Math.random() * 20) + 3,
          torneosActivos: Math.floor(Math.random() * 5) + 1,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard del Club</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/club-admin/noticias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva noticia
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.noticias}</div>
            <p className="text-xs text-muted-foreground">
              +2 esta semana
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Torneos activos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.torneosActivos}</div>
            <p className="text-xs text-muted-foreground">
              de {loading ? '...' : stats.torneos} totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% desde el mes pasado
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Activity items would go here */}
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Nueva noticia publicada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hace 3 horas
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Nuevo torneo creado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hace 5 horas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/club-admin/noticias/nueva">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva noticia
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/club-admin/torneos/nuevo">
                  <Trophy className="mr-2 h-4 w-4" />
                  Nuevo torneo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

