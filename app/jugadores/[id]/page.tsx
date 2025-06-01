import Link from "next/link"
import { Calendar, ChevronLeft, MapPin, Medal, Trophy, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Base de datos simulada de jugadores
const jugadoresDB = [
  {
    id: 1,
    nombre: "Laura Martínez",
    club: "Club de Ajedrez Bahía Blanca",
    elo: 2350,
    categoria: "Absoluto",
    titulo: "GM",
    edad: 28,
    fechaNacimiento: "15/04/1996",
    email: "laura.martinez@example.com",
    telefono: "+54 291 123-4567",
    avatar: "/placeholder.svg?height=200&width=200",
    biografia:
      "Gran Maestra de ajedrez con más de 15 años de experiencia en competiciones nacionales e internacionales. Campeona regional en múltiples ocasiones y representante argentina en olimpiadas de ajedrez.",
    logros: [
      "Campeona Regional FASGBA 2023",
      "Medalla de oro en Olimpiada Nacional 2022",
      "Campeona del Torneo de Verano Monte Hermoso 2024",
      "Mejor jugadora femenina FASGBA 2021-2023",
    ],
    torneos: {
      proximos: [
        {
          id: "gran-prix-2025",
          nombre: "Gran Prix FASGBA 2025",
          fecha: "15 de Abril, 2025",
          lugar: "Club de Ajedrez Bahía Blanca",
        },
      ],
      pasados: [
        {
          id: "abierto-verano-2024",
          nombre: "Abierto de Verano 2024",
          fecha: "5 al 7 de Enero, 2024",
          lugar: "Club de Ajedrez Monte Hermoso",
          resultado: "1° lugar - 5.5/6 puntos",
        },
        {
          id: "copa-aniversario-2023",
          nombre: "Copa Aniversario FASGBA 2023",
          fecha: "15 de Mayo, 2023",
          lugar: "Círculo de Ajedrez Pigüé",
          resultado: "2° lugar - 5/6 puntos",
        },
        {
          id: "campeonato-regional-2023",
          nombre: "Campeonato Regional Individual 2023",
          fecha: "10 al 12 de Junio, 2023",
          lugar: "Club de Ajedrez Bahía Blanca",
          resultado: "1° lugar - 5/6 puntos",
        },
      ],
    },
    historialElo: [
      { fecha: "Marzo 2025", elo: 2350, cambio: "+15" },
      { fecha: "Febrero 2025", elo: 2335, cambio: "+5" },
      { fecha: "Enero 2025", elo: 2330, cambio: "+20" },
      { fecha: "Diciembre 2024", elo: 2310, cambio: "-10" },
      { fecha: "Noviembre 2024", elo: 2320, cambio: "+0" },
      { fecha: "Octubre 2024", elo: 2320, cambio: "+15" },
    ],
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez",
    club: "Círculo de Ajedrez Punta Alta",
    elo: 2280,
    categoria: "Absoluto",
    titulo: "IM",
    edad: 32,
    fechaNacimiento: "22/08/1992",
    email: "carlos.rodriguez@example.com",
    telefono: "+54 291 234-5678",
    avatar: "/placeholder.svg?height=200&width=200",
    biografia:
      "Maestro Internacional con amplia experiencia en torneos nacionales e internacionales. Especialista en finales y reconocido por su estilo táctico agresivo.",
    logros: [
      "Subcampeón Regional FASGBA 2023",
      "Campeón Copa Aniversario FASGBA 2023",
      "Mejor performance en Torneo Internacional Mar del Plata 2022",
    ],
    torneos: {
      proximos: [
        {
          id: "gran-prix-2025",
          nombre: "Gran Prix FASGBA 2025",
          fecha: "15 de Abril, 2025",
          lugar: "Club de Ajedrez Bahía Blanca",
        },
        {
          id: "torneo-rapido-mayo",
          nombre: "Torneo Rápido de Mayo",
          fecha: "25 de Mayo, 2025",
          lugar: "Círculo de Ajedrez Punta Alta",
        },
      ],
      pasados: [
        {
          id: "copa-aniversario-2023",
          nombre: "Copa Aniversario FASGBA 2023",
          fecha: "15 de Mayo, 2023",
          lugar: "Círculo de Ajedrez Pigüé",
          resultado: "1° lugar - 6.5/7 puntos",
        },
        {
          id: "campeonato-regional-2023",
          nombre: "Campeonato Regional Individual 2023",
          fecha: "10 al 12 de Junio, 2023",
          lugar: "Club de Ajedrez Bahía Blanca",
          resultado: "2° lugar - 4.5/6 puntos",
        },
      ],
    },
    historialElo: [
      { fecha: "Marzo 2025", elo: 2280, cambio: "+10" },
      { fecha: "Febrero 2025", elo: 2270, cambio: "+0" },
      { fecha: "Enero 2025", elo: 2270, cambio: "+15" },
      { fecha: "Diciembre 2024", elo: 2255, cambio: "+5" },
      { fecha: "Noviembre 2024", elo: 2250, cambio: "-10" },
      { fecha: "Octubre 2024", elo: 2260, cambio: "+0" },
    ],
  },
  // Podríamos añadir más jugadores aquí
]

export default async function JugadorPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before using its properties (Next.js 15 requirement)
  const { id } = await params
  
  // Buscar el jugador por ID
  const jugador = jugadoresDB.find((j) => j.id.toString() === id)

  // Si no se encuentra el jugador, mostrar mensaje de error
  if (!jugador) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta mb-4">Jugador no encontrado</h1>
            <p className="text-muted-foreground mb-6">El jugador que estás buscando no existe o ha sido eliminado.</p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Link href="/ranking">Volver al ranking</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mb-6 border-amber text-amber-dark hover:bg-amber/10"
            >
              <Link href="/ranking">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver al ranking
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
              {/* Columna izquierda - Información del perfil */}
              <div className="space-y-6">
                <Card className="border-amber/20">
                  <CardHeader className="pb-2 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-amber mb-4">
                      <AvatarImage src={jugador.avatar} alt={jugador.nombre} />
                      <AvatarFallback className="bg-amber/10 text-amber-dark text-2xl">
                        {jugador.nombre.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl text-terracotta">
                      {jugador.titulo && <span className="mr-2">{jugador.titulo}</span>}
                      {jugador.nombre}
                    </CardTitle>
                    <CardDescription>{jugador.club}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
                      ELO: {jugador.elo}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{jugador.biografia}</p>
                  </CardContent>
                </Card>

                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Información personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Edad</p>
                        <p className="text-sm text-muted-foreground">{jugador.edad} años</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Fecha de nacimiento</p>
                        <p className="text-sm text-muted-foreground">{jugador.fechaNacimiento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Club</p>
                        <p className="text-sm text-muted-foreground">
                          <Link href={`/clubes/${jugador.club.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="text-amber-dark hover:underline">
                            {jugador.club}
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Categoría</p>
                        <p className="text-sm text-muted-foreground">{jugador.categoria}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Logros destacados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {jugador.logros.map((logro, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Medal className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                          <span className="text-sm">{logro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Columna derecha - Pestañas con torneos y estadísticas */}
              <div>
                <Tabs defaultValue="torneos" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted border border-amber/20 mb-6">
                    <TabsTrigger value="torneos" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                      Torneos
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                      Historial ELO
                    </TabsTrigger>
                  </TabsList>

                  {/* Pestaña de Torneos */}
                  <TabsContent value="torneos">
                    <div className="space-y-6">
                      {jugador.torneos.proximos.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-terracotta mb-4">Próximos torneos</h3>
                          <div className="pace-y-4">
                            {jugador.torneos.proximos.map((torneo) => (
                              <Card key={torneo.id} className="border-amber/20">
                                <CardContent className="p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                      <h4 className="font-bold text-terracotta">{torneo.nombre}</h4>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4 text-amber" />
                                          <span>{torneo.fecha}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4 text-amber" />
                                          <span>{torneo.lugar}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-xl font-bold text-terracotta mb-4">Torneos pasados</h3>
                        <div className="space-y-4">
                          {jugador.torneos.pasados.map((torneo) => (
                            <Card key={torneo.id} className="border-amber/20">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div>
                                    <h4 className="font-bold text-terracotta">{torneo.nombre}</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-amber" />
                                        <span>{torneo.fecha}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4 text-amber" />
                                        <span>{torneo.lugar}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <Badge className="bg-amber text-white hover:bg-amber/90">
                                      {torneo.resultado}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="text-center">
                        <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                          <Link href="/torneos">
                            Ver todos los torneos
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pestaña de Historial ELO */}
                  <TabsContent value="historial">
                    <Card className="border-amber/20">
                      <CardHeader>
                        <CardTitle className="text-terracotta">Evolución de ELO</CardTitle>
                        <CardDescription>Historial de los últimos 6 meses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
                          <p className="text-muted-foreground">Gráfico de evolución de ELO</p>
                        </div>
                        <div className="mt-6">
                          <div className="rounded-md border border-amber/20">
                            <div className="grid grid-cols-3 border-b border-amber/20 bg-muted/50">
                              <div className="p-2 font-medium">Fecha</div>
                              <div className="p-2 font-medium text-center">ELO</div>
                              <div className="p-2 font-medium text-right">Cambio</div>
                            </div>
                            {jugador.historialElo.map((item, index) => (
                              <div key={index} className="grid grid-cols-3 border-b border-amber/10 last:border-0">
                                <div className="p-2">{item.fecha}</div>
                                <div className="p-2 text-center">{item.elo}</div>
                                <div className={`p-2 text-right ${
                                  item.cambio.startsWith('+') 
                                    ? 'text-green-500' 
                                    : item.cambio.startsWith('-') 
                                      ? 'text-red-500' 
                                      : ''
                                }`}>
                                  {item.cambio}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

