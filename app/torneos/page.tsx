"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp, Clock, MapPin, Trophy, Users, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import {
  type TournamentDisplay,
  getAllTournamentsForDisplay,
  filterTournamentsByStatus,
  sortTournamentsByDate,
  getCostDisplay,
  getLocationDisplay,
  getRoundsDisplay,
  getPaceDisplay,
  getTournamentStatusText,
  formatDateRange,
  checkTournamentsTable,
  checkTournamentsTableStructure,
} from "@/lib/tournamentUtils"

// Componente para mostrar un torneo con expansión
function TorneoCard({
  torneo,
  tipo,
  expanded,
  toggleExpand,
}: {
  torneo: TournamentDisplay
  tipo: 'upcoming' | 'ongoing' | 'past'
  expanded: boolean
  toggleExpand: () => void
}) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "Horario por confirmar"
    return timeStr
  }

  const formatRounds = (rounds: number | null) => {
    if (!rounds) return "Por definir"
    return `${rounds} rondas`
  }

  return (
    <Card className={cn("border-amber/20 shadow-md transition-all duration-300", expanded ? "col-span-full" : "")}>
      <CardHeader className="pb-3 border-b border-amber/10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-terracotta">{torneo.title}</CardTitle>
            <CardDescription>{torneo.description || "Información del torneo próximamente"}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="text-amber hover:text-amber-dark hover:bg-amber/10"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={cn("grid gap-4", expanded ? "md:grid-cols-2" : "")}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber" />
              <span className="text-sm">
                {torneo.end_date && torneo.start_date.toDateString() !== torneo.end_date.toDateString()
                  ? formatDateRange(torneo.start_date, torneo.end_date)
                  : torneo.formatted_start_date}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber" />
              <span className="text-sm">{formatTime(torneo.time)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
              <div>
                {torneo.place && (
                  <span className="text-sm block text-amber-dark">
                    {torneo.place}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {getLocationDisplay(torneo.place, torneo.location)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber" />
              <span className="text-sm">
                {formatRounds(torneo.rounds)} - {getPaceDisplay(torneo.pace)}
              </span>
            </div>
            {tipo !== "past" && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber" />
                <div>
                  <span className="text-sm block">
                    {torneo.inscription_details || "Información de inscripción próximamente"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Costo: {getCostDisplay(torneo.cost)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber" />
              <span className={cn(
                "text-sm font-medium px-2 py-1 rounded-full text-xs",
                tipo === "upcoming" && "bg-blue-100 text-blue-800",
                tipo === "ongoing" && "bg-green-100 text-green-800", 
                tipo === "past" && "bg-gray-100 text-gray-800"
              )}>
                {getTournamentStatusText(torneo)}
              </span>
            </div>
          </div>

          {expanded && (
            <div className="space-y-4">
              {torneo.image && (
                <img
                  src={torneo.image}
                  alt={`Flyer del torneo ${torneo.title}`}
                  className="w-full rounded-lg object-cover border border-amber/20 max-h-64"
                />
              )}

              {torneo.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Descripción:</h4>
                  <p className="text-sm text-muted-foreground">{torneo.description}</p>
                </div>
              )}

              {torneo.prizes && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Premios:</h4>
                  <p className="text-sm text-muted-foreground">{torneo.prizes}</p>
                </div>
              )}

              {torneo.duration_days && torneo.duration_days > 1 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Duración:</h4>
                  <p className="text-sm text-muted-foreground">
                    {torneo.duration_days} día{torneo.duration_days !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {tipo === "upcoming" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-terracotta hover:bg-terracotta/90 text-white">
                Inscripción
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-amber/20">
              <DialogHeader>
                <DialogTitle className="text-terracotta">Inscripción: {torneo.title}</DialogTitle>
                <DialogDescription>Complete el formulario para inscribirse en el torneo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="nombre" className="text-right text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="club" className="text-right text-sm font-medium">
                    Club
                  </label>
                  <input
                    id="club"
                    className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Club al que representa"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="telefono" className="text-right text-sm font-medium">
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="+54 291 123-4567"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="categoria" className="text-right text-sm font-medium">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="general">General</option>
                    <option value="sub18">Sub-18</option>
                    <option value="sub14">Sub-14</option>
                    <option value="sub10">Sub-10</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="border-amber text-amber-dark hover:bg-amber/10 hover:text-amber-dark"
                  >
                    Cancelar
                  </Button>
                </DialogClose>
                <Button className="bg-terracotta hover:bg-terracotta/90 text-white">Confirmar inscripción</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  )
}

export default function TorneosPage() {
  // Estado para controlar qué torneo está expandido en cada categoría
  const [expandedProximo, setExpandedProximo] = useState<number | null>(null)
  const [expandedEnCurso, setExpandedEnCurso] = useState<number | null>(null)
  const [expandedPasado, setExpandedPasado] = useState<number | null>(null)
  
  // Estado para los datos de torneos
  const [tournaments, setTournaments] = useState<TournamentDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cargar torneos al montar el componente
  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true)
        setError(null)
        
        // First check if the table exists and has data
        console.log('Checking tournaments table status...')
        const tableStatus = await checkTournamentsTable(supabase)
        console.log('Table status:', tableStatus)
        
        // Check what columns actually exist
        console.log('Checking table structure...')
        const tableStructure = await checkTournamentsTableStructure(supabase)
        console.log('Table structure:', tableStructure)
        
        if (!tableStatus.tableExists) {
          throw new Error(`La tabla de torneos no existe: ${tableStatus.error}`)
        }
        
        if (tableStatus.rowCount === 0) {
          console.log('No tournaments found in database')
          setTournaments([])
          return
        }
        
        console.log(`Found ${tableStatus.rowCount} tournaments, fetching all...`)
        const tournamentsData = await getAllTournamentsForDisplay(supabase)
        const sortedTournaments = sortTournamentsByDate(tournamentsData, 'asc')
        setTournaments(sortedTournaments)
      } catch (err) {
        console.error('Error loading tournaments:', err)
        setError(`Error al cargar los torneos: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    loadTournaments()
  }, [])

  // Filtrar torneos por estado
  const upcomingTournaments = filterTournamentsByStatus(tournaments, 'upcoming')
  const ongoingTournaments = filterTournamentsByStatus(tournaments, 'ongoing')
  const pastTournaments = filterTournamentsByStatus(tournaments, 'past')

  // Componente de carga
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-black">Torneos FASGBA</h1>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Calendario completo de torneos organizados por la Federación de Ajedrez del Sur de Buenos Aires
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber" />
                <span className="ml-2 text-muted-foreground">Cargando torneos...</span>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Torneos FASGBA</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Calendario completo de torneos organizados por la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted border border-amber/20 mb-8">
                <TabsTrigger value="proximos" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Próximos Torneos ({upcomingTournaments.length})
                </TabsTrigger>
                <TabsTrigger value="en-curso" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Torneos en Curso ({ongoingTournaments.length})
                </TabsTrigger>
                <TabsTrigger value="pasados" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Torneos Pasados ({pastTournaments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="proximos">
                {upcomingTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay torneos próximos programados en este momento.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingTournaments.map((torneo) => (
                      <TorneoCard
                        key={torneo.id}
                        torneo={torneo}
                        tipo="upcoming"
                        expanded={expandedProximo === torneo.id}
                        toggleExpand={() => setExpandedProximo(expandedProximo === torneo.id ? null : torneo.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="en-curso">
                {ongoingTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay torneos en curso en este momento.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {ongoingTournaments.map((torneo) => (
                      <TorneoCard
                        key={torneo.id}
                        torneo={torneo}
                        tipo="ongoing"
                        expanded={expandedEnCurso === torneo.id}
                        toggleExpand={() => setExpandedEnCurso(expandedEnCurso === torneo.id ? null : torneo.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pasados">
                {pastTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay torneos pasados registrados.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pastTournaments.map((torneo) => (
                      <TorneoCard
                        key={torneo.id}
                        torneo={torneo}
                        tipo="past"
                        expanded={expandedPasado === torneo.id}
                        toggleExpand={() => setExpandedPasado(expandedPasado === torneo.id ? null : torneo.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

