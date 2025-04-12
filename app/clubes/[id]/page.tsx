"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Mail, MapPin, Phone, Clock, Calendar, User, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo para los clubes
const clubes = [
  {
    id: "bahia-blanca",
    nombre: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    telefono: "+54 291 123-4567",
    email: "info@cabb.org.ar",
    horarios: "Lunes a Viernes: 17:00 - 22:00, Sábados: 15:00 - 20:00",
    descripcion:
      "Fundado en 1950, es uno de los clubes más antiguos de la región con una rica historia en el ajedrez local.",
    delegado: "Carlos Martínez",
    historia:
      "El Club de Ajedrez Bahía Blanca fue fundado el 15 de marzo de 1950 por un grupo de entusiastas del ajedrez liderados por el Dr. Roberto Fernández. Desde sus inicios, el club se ha destacado por su compromiso con la formación de nuevos talentos y la organización de torneos de alto nivel. A lo largo de su historia, ha sido sede de importantes competiciones regionales y nacionales, y ha visto surgir a varios Maestros FIDE y Grandes Maestros.",
    instalaciones: [
      "Sala principal con capacidad para 50 jugadores",
      "Biblioteca especializada con más de 500 libros de ajedrez",
      "Sala de análisis con tableros electrónicos",
      "Cafetería",
      "Proyector y pantalla para clases y análisis",
    ],
    proximosEventos: [
      {
        nombre: "Torneo Rápido Mensual",
        fecha: "15 de Abril, 2025",
        hora: "18:00hs",
        descripcion: "Torneo de partidas rápidas (10+5) abierto a todos los socios.",
      },
      {
        nombre: "Clase Magistral GM Laura Martínez",
        fecha: "22 de Abril, 2025",
        hora: "19:00hs",
        descripcion: "Análisis de partidas clásicas y sesión de preguntas y respuestas.",
      },
    ],
    jugadoresDestacados: [
      {
        id: 1,
        nombre: "Laura Martínez",
        titulo: "GM",
        elo: 2350,
      },
      {
        id: 7,
        nombre: "Matías González",
        titulo: "",
        elo: 2000,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Sala+Principal",
      "/placeholder.svg?height=300&width=400&text=Torneo+2024",
      "/placeholder.svg?height=300&width=400&text=Clase+Grupal",
      "/placeholder.svg?height=300&width=400&text=Biblioteca",
    ],
  },
  {
    id: "punta-alta",
    nombre: "Círculo de Ajedrez Punta Alta",
    direccion: "Rivadavia 450, Punta Alta",
    telefono: "+54 291 456-7890",
    email: "contacto@capa.org.ar",
    horarios: "Martes y Jueves: 18:00 - 22:00, Sábados: 16:00 - 21:00",
    descripcion:
      "Club especializado en la formación de jóvenes talentos con un fuerte enfoque en el ajedrez educativo.",
    delegado: "Laura Gómez",
    historia:
      "El Círculo de Ajedrez Punta Alta fue fundado en 1978 con el objetivo principal de promover el ajedrez entre los jóvenes de la ciudad. Desde entonces, se ha destacado por su programa educativo que ha llevado el ajedrez a numerosas escuelas de la zona. En 2010, el club se trasladó a su sede actual, lo que permitió ampliar sus actividades y servicios.",
    instalaciones: [
      "Sala de juego con capacidad para 30 jugadores",
      "Aula para clases con 15 tableros didácticos",
      "Pequeña biblioteca de ajedrez",
      "Área de recreación",
    ],
    proximosEventos: [
      {
        nombre: "Torneo Escolar Intercolegial",
        fecha: "20 de Abril, 2025",
        hora: "10:00hs",
        descripcion: "Competencia entre escuelas de la ciudad en categorías sub-10, sub-14 y sub-18.",
      },
      {
        nombre: "Taller de Ajedrez para Padres",
        fecha: "27 de Abril, 2025",
        hora: "17:00hs",
        descripcion: "Introducción al ajedrez para padres que quieren apoyar a sus hijos en este deporte.",
      },
    ],
    jugadoresDestacados: [
      {
        id: 2,
        nombre: "Carlos Rodríguez",
        titulo: "IM",
        elo: 2280,
      },
      {
        id: 9,
        nombre: "Tomás Rodríguez",
        titulo: "",
        elo: 1900,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Sede+Actual",
      "/placeholder.svg?height=300&width=400&text=Clase+Infantil",
      "/placeholder.svg?height=300&width=400&text=Torneo+Escolar",
      "/placeholder.svg?height=300&width=400&text=Exhibición",
    ],
  },
  {
    id: "tres-arroyos",
    nombre: "Club de Ajedrez Tres Arroyos",
    direccion: "San Martín 789, Tres Arroyos",
    telefono: "+54 291 234-5678",
    email: "ajedrez@cata.org.ar",
    horarios: "Lunes, Miércoles y Viernes: 18:00 - 22:00, Domingos: 10:00 - 13:00",
    descripcion: "Reconocido por sus torneos rápidos mensuales y su escuela de ajedrez para todas las edades.",
    delegado: "Roberto Sánchez",
    historia:
      "Fundado en 1965, el Club de Ajedrez Tres Arroyos comenzó como un pequeño grupo de aficionados que se reunían en un café local. Con el tiempo, el club creció y se estableció en su sede actual en 1982. Se ha destacado por organizar torneos rápidos mensuales que atraen a jugadores de toda la región, así como por su escuela de ajedrez que ha formado a varias generaciones de ajedrecistas.",
    instalaciones: [
      "Amplio salón con capacidad para 40 jugadores",
      "Sala de análisis",
      "Biblioteca con literatura de ajedrez",
      "Área social con cafetería",
    ],
    proximosEventos: [
      {
        nombre: "Torneo Rápido Mensual",
        fecha: "5 de Mayo, 2025",
        hora: "19:00hs",
        descripcion: "Torneo de partidas rápidas (15+10) con premios para los tres primeros lugares.",
      },
      {
        nombre: "Simultánea con FM Martín López",
        fecha: "12 de Mayo, 2025",
        hora: "18:00hs",
        descripcion: "Exhibición donde el FM Martín López jugará simultáneamente contra 20 participantes.",
      },
    ],
    jugadoresDestacados: [
      {
        id: 3,
        nombre: "Martín López",
        titulo: "FM",
        elo: 2210,
      },
      {
        id: 8,
        nombre: "Valentina Pérez",
        titulo: "",
        elo: 1950,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Salón+Principal",
      "/placeholder.svg?height=300&width=400&text=Torneo+Rápido",
      "/placeholder.svg?height=300&width=400&text=Clase+Grupal",
      "/placeholder.svg?height=300&width=400&text=Simultánea",
    ],
  },
  {
    id: "coronel-suarez",
    nombre: "Círculo de Ajedrez Coronel Suárez",
    direccion: "Belgrano 567, Coronel Suárez",
    telefono: "+54 291 345-6789",
    email: "info@cacs.org.ar",
    horarios: "Martes y Jueves: 17:00 - 21:00, Sábados: 15:00 - 19:00",
    descripcion: "Club con fuerte tradición en torneos por equipos y formación de árbitros de ajedrez.",
    delegado: "María López",
    historia:
      "El Círculo de Ajedrez Coronel Suárez se fundó en 1972 y desde sus inicios se ha destacado por su enfoque en los torneos por equipos. El club ha sido pionero en la región en la formación de árbitros de ajedrez, contando actualmente con cinco árbitros nacionales entre sus miembros. En 2015, el club organizó por primera vez el Campeonato Provincial por Equipos, evento que desde entonces se ha convertido en una tradición anual.",
    instalaciones: [
      "Sala de juego con capacidad para 25 jugadores",
      "Oficina para árbitros",
      "Pequeña biblioteca especializada en reglamentos y arbitraje",
      "Área de descanso",
    ],
    proximosEventos: [
      {
        nombre: "Curso de Arbitraje Nivel Inicial",
        fecha: "18-19 de Mayo, 2025",
        hora: "10:00 a 18:00hs",
        descripcion: "Curso teórico-práctico para la formación de nuevos árbitros regionales.",
      },
      {
        nombre: "Torneo por Equipos",
        fecha: "25 de Mayo, 2025",
        hora: "09:00hs",
        descripcion: "Competencia por equipos de 4 jugadores con representantes de clubes de la región.",
      },
    ],
    jugadoresDestacados: [
      {
        id: 4,
        nombre: "Ana García",
        titulo: "WIM",
        elo: 2150,
      },
      {
        id: 11,
        nombre: "Lucas Martínez",
        titulo: "",
        elo: 1800,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Sede+del+Club",
      "/placeholder.svg?height=300&width=400&text=Torneo+por+Equipos",
      "/placeholder.svg?height=300&width=400&text=Curso+de+Arbitraje",
      "/placeholder.svg?height=300&width=400&text=Competencia+2024",
    ],
  },
  {
    id: "monte-hermoso",
    nombre: "Club de Ajedrez Monte Hermoso",
    direccion: "Costanera 234, Monte Hermoso",
    telefono: "+54 291 567-8901",
    email: "contacto@camh.org.ar",
    horarios: "Miércoles y Viernes: 18:00 - 22:00, Domingos: 16:00 - 20:00",
    descripcion: "Club costero que organiza torneos de verano con gran participación de turistas y locales.",
    delegado: "Juan Pérez",
    historia:
      "El Club de Ajedrez Monte Hermoso fue fundado en 1985 por un grupo de residentes permanentes de la ciudad balnearia. Su característica más distintiva es la organización del tradicional Torneo de Verano, que se celebra anualmente en enero y atrae a jugadores de todo el país que combinan sus vacaciones con la práctica del ajedrez. Durante la temporada estival, el club amplía sus horarios y actividades para dar cabida a los turistas aficionados al ajedrez.",
    instalaciones: [
      "Sala principal con vista al mar con capacidad para 35 jugadores",
      "Terraza para juegos al aire libre durante el verano",
      "Pequeña tienda de artículos de ajedrez",
      "Área de recreación",
    ],
    proximosEventos: [
      {
        nombre: "Torneo de Otoño",
        fecha: "4-5 de Mayo, 2025",
        hora: "16:00hs",
        descripcion: "Torneo de dos días con ritmo de juego clásico (90min + 30seg).",
      },
      {
        nombre: "Ajedrez en la Playa",
        fecha: "11 de Mayo, 2025",
        hora: "11:00hs",
        descripcion: "Exhibición y partidas amistosas en la playa central (clima permitiendo).",
      },
    ],
    jugadoresDestacados: [
      {
        id: 5,
        nombre: "Pablo Sánchez",
        titulo: "FM",
        elo: 2100,
      },
      {
        id: 10,
        nombre: "Sofía López",
        titulo: "",
        elo: 1850,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Club+Vista+Mar",
      "/placeholder.svg?height=300&width=400&text=Torneo+de+Verano",
      "/placeholder.svg?height=300&width=400&text=Ajedrez+en+Playa",
      "/placeholder.svg?height=300&width=400&text=Sala+Principal",
    ],
  },
  {
    id: "pigüe",
    nombre: "Círculo de Ajedrez Pigüé",
    direccion: "Mitre 345, Pigüé",
    telefono: "+54 291 678-9012",
    email: "ajedrez@cap.org.ar",
    horarios: "Lunes y Jueves: 17:30 - 21:30, Sábados: 16:00 - 20:00",
    descripcion: "Club centenario con una rica historia y tradición en el ajedrez regional.",
    delegado: "Ana Rodríguez",
    historia:
      "El Círculo de Ajedrez Pigüé es el club más antiguo de la región, fundado en 1920 por inmigrantes franceses aficionados al ajedrez. A lo largo de su centenaria historia, el club ha mantenido vivas las tradiciones ajedrecísticas y ha sido un importante centro cultural de la ciudad. En 2020, celebró su centenario con un torneo internacional que contó con la participación de jugadores de Argentina, Francia, España y Uruguay, en homenaje a sus fundadores.",
    instalaciones: [
      "Salón histórico con capacidad para 30 jugadores",
      "Museo del ajedrez con piezas y tableros antiguos",
      "Biblioteca con libros en español y francés",
      "Sala de conferencias",
    ],
    proximosEventos: [
      {
        nombre: "Torneo Aniversario 105 años",
        fecha: "1-2 de Junio, 2025",
        hora: "10:00hs",
        descripcion: "Torneo especial para conmemorar el 105° aniversario del club.",
      },
      {
        nombre: "Conferencia: Historia del Ajedrez en la Región",
        fecha: "15 de Mayo, 2025",
        hora: "19:00hs",
        descripcion: "Charla a cargo del historiador local Dr. Martín Fernández.",
      },
    ],
    jugadoresDestacados: [
      {
        id: 6,
        nombre: "Lucía Fernández",
        titulo: "WFM",
        elo: 2050,
      },
      {
        id: 12,
        nombre: "Camila García",
        titulo: "",
        elo: 1750,
      },
    ],
    galeria: [
      "/placeholder.svg?height=300&width=400&text=Edificio+Histórico",
      "/placeholder.svg?height=300&width=400&text=Museo+del+Ajedrez",
      "/placeholder.svg?height=300&width=400&text=Torneo+Centenario",
      "/placeholder.svg?height=300&width=400&text=Biblioteca",
    ],
  },
]

export default function ClubDetailPage({ params }) {
  const club = clubes.find((c) => c.id === params.id)
  const [siguiendo, setSiguiendo] = useState(false)

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta mb-4">Club no encontrado</h1>
            <p className="text-muted-foreground mb-6">El club que estás buscando no existe o ha sido eliminado.</p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Link href="/clubes">Volver a clubes</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const toggleSeguir = () => {
    setSiguiendo(!siguiendo)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <Button asChild variant="outline" size="sm" className="mb-6 border-amber text-amber-dark hover:bg-amber/10">
              <Link href="/clubes">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a clubes
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-12">
              {/* Columna izquierda - Información principal */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-terracotta">{club.nombre}</h1>
                    <p className="mt-2 text-muted-foreground">{club.descripcion}</p>
                  </div>
                  <Button
                    onClick={toggleSeguir}
                    variant={siguiendo ? "default" : "outline"}
                    className={
                      siguiendo
                        ? "bg-terracotta hover:bg-terracotta/90 text-white"
                        : "border-terracotta text-terracotta hover:bg-terracotta/10"
                    }
                  >
                    <Heart className={`mr-2 h-4 w-4 ${siguiendo ? "fill-current" : ""}`} />
                    {siguiendo ? "Siguiendo" : "Seguir"}
                  </Button>
                </div>

                <Tabs defaultValue="informacion" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted border border-amber/20 mb-6">
                    <TabsTrigger
                      value="informacion"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Información
                    </TabsTrigger>
                    <TabsTrigger
                      value="eventos"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Eventos
                    </TabsTrigger>
                    <TabsTrigger
                      value="jugadores"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Jugadores
                    </TabsTrigger>
                    <TabsTrigger
                      value="galeria"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Galería
                    </TabsTrigger>
                  </TabsList>

                  {/* Pestaña de Información */}
                  <TabsContent value="informacion">
                    <Card className="border-amber/20">
                      <CardHeader>
                        <CardTitle className="text-terracotta">Historia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{club.historia}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-amber/20 mt-6">
                      <CardHeader>
                        <CardTitle className="text-terracotta">Instalaciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {club.instalaciones.map((instalacion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber mt-1.5"></div>
                              <span className="text-muted-foreground">{instalacion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Pestaña de Eventos */}
                  <TabsContent value="eventos">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-terracotta">Próximos eventos</h3>
                      {club.proximosEventos.map((evento, index) => (
                        <Card key={index} className="border-amber/20">
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                              <div>
                                <h4 className="text-lg font-bold text-terracotta">{evento.nombre}</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-amber" />
                                    <span className="text-sm">{evento.fecha}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-amber" />
                                    <span className="text-sm">{evento.hora}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-muted-foreground">{evento.descripcion}</p>
                              <div className="flex justify-end">
                                <Button variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                                  Más información
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Pestaña de Jugadores */}
                  <TabsContent value="jugadores">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-terracotta">Jugadores destacados</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {club.jugadoresDestacados.map((jugador) => (
                          <Card key={jugador.id} className="border-amber/20">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-amber/10 flex items-center justify-center">
                                  <User className="h-6 w-6 text-amber" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-terracotta flex items-center">
                                    {jugador.titulo && (
                                      <Badge className="mr-2 bg-amber text-white">{jugador.titulo}</Badge>
                                    )}
                                    <Link href={`/jugadores/${jugador.id}`} className="hover:underline">
                                      {jugador.nombre}
                                    </Link>
                                  </h4>
                                  <p className="text-sm text-muted-foreground">ELO: {jugador.elo}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pestaña de Galería */}
                  <TabsContent value="galeria">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-terracotta">Galería de imágenes</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {club.galeria.map((imagen, index) => (
                          <div key={index} className="overflow-hidden rounded-lg border border-amber/20">
                            <img
                              src={imagen || "/placeholder.svg"}
                              alt={`Imagen ${index + 1} del ${club.nombre}`}
                              className="aspect-video w-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Columna derecha - Información de contacto */}
              <div className="space-y-6">
                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Información de contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dirección</p>
                        <p className="text-sm text-muted-foreground">{club.direccion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">{club.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{club.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Horarios</p>
                        <p className="text-sm text-muted-foreground">{club.horarios}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-amber" />
                      <div>
                        <p className="text-sm font-medium">Delegado</p>
                        <p className="text-sm text-muted-foreground">{club.delegado}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Ubicación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">Mapa de ubicación</p>
                    </div>
                    <Button className="w-full mt-4 bg-terracotta hover:bg-terracotta/90 text-white">
                      Ver en Google Maps
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Seguidores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{siguiendo ? 157 : 156}</span>
                      <Button
                        onClick={toggleSeguir}
                        variant={siguiendo ? "default" : "outline"}
                        size="sm"
                        className={
                          siguiendo
                            ? "bg-terracotta hover:bg-terracotta/90 text-white"
                            : "border-terracotta text-terracotta hover:bg-terracotta/10"
                        }
                      >
                        <Heart className={`mr-2 h-4 w-4 ${siguiendo ? "fill-current" : ""}`} />
                        {siguiendo ? "Siguiendo" : "Seguir"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

