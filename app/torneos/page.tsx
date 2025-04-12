"use client"

import { useState } from "react"
import { Calendar, ChevronDown, ChevronUp, Clock, MapPin, Trophy, Users } from "lucide-react"

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
import { cn } from "@/lib/utils"
import Link from "next/link"

// Datos de ejemplo para los torneos
const torneosProximos = [
  {
    id: "gran-prix-2024",
    nombre: "Gran Prix FASGBA 2024",
    fecha: "15 de Abril, 2024",
    hora: "10:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    ritmo: "90 min + 30 seg",
    rondas: 7,
    sistema: "Suizo",
    descripcion: "Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.",
    inscripcion: "Abierta hasta el 14 de Abril",
    costo: "$5000 general, $3000 sub-18",
    imagen: "/placeholder.svg?height=400&width=600",
    bases:
      "El torneo se jugará por Sistema Suizo a 7 rondas. Válido para el ranking FIDE. Ritmo de juego: 90 minutos más 30 segundos de incremento por jugada desde la movida 1. Se otorgarán premios en efectivo para los primeros 5 puestos y trofeos para los 3 primeros.",
  },
  {
    id: "torneo-rapido-mayo",
    nombre: "Torneo Rápido de Mayo",
    fecha: "25 de Mayo, 2024",
    hora: "14:00hs",
    lugar: "Círculo de Ajedrez Punta Alta",
    direccion: "Rivadavia 450, Punta Alta",
    ritmo: "10 min + 5 seg",
    rondas: 9,
    sistema: "Suizo",
    descripcion: "Torneo rápido conmemorativo del 25 de Mayo con premios especiales.",
    inscripcion: "Abierta hasta el 24 de Mayo",
    costo: "$2000 general, $1000 sub-18",
    imagen: "/placeholder.svg?height=400&width=600",
    bases:
      "Torneo rápido a 9 rondas por Sistema Suizo. Ritmo de juego: 10 minutos más 5 segundos de incremento por jugada. Premios especiales conmemorativos del 25 de Mayo para los primeros 3 puestos en cada categoría (general, sub-18, sub-14).",
  },
  {
    id: "campeonato-regional-junio",
    nombre: "Campeonato Regional Individual",
    fecha: "10 al 12 de Junio, 2024",
    hora: "10:00hs",
    lugar: "Club de Ajedrez Tres Arroyos",
    direccion: "San Martín 789, Tres Arroyos",
    ritmo: "90 min + 30 seg",
    rondas: 6,
    sistema: "Suizo",
    descripcion: "Campeonato oficial de FASGBA válido para el ranking nacional y FIDE.",
    inscripcion: "Abierta hasta el 5 de Junio",
    costo: "$6000 general, $4000 sub-18",
    imagen: "/placeholder.svg?height=400&width=600",
    bases:
      "Campeonato oficial de FASGBA válido para el ranking nacional y FIDE. Sistema Suizo a 6 rondas. Ritmo de juego: 90 minutos más 30 segundos de incremento por jugada. El campeón obtendrá el título de Campeón Regional 2024 y clasificación directa al Campeonato Argentino.",
  },
]

const torneosEnCurso = [
  {
    id: "regional-equipos-2024",
    nombre: "Campeonato Regional por Equipos",
    fecha: "Marzo a Mayo, 2024",
    hora: "Sábados 15:00hs",
    lugar: "Sedes rotativas",
    direccion: "Diferentes clubes de la región",
    ritmo: "90 min + 30 seg",
    rondas: "7 (Actual: Ronda 3)",
    sistema: "Suizo por equipos",
    descripcion: "Torneo oficial por equipos con representantes de todos los clubes afiliados.",
    inscripcion: "Cerrada",
    costo: "$10000 por equipo",
    imagen: "/placeholder.svg?height=400&width=600",
    bases:
      "Torneo por equipos de 4 jugadores titulares y 2 suplentes. Cada club puede presentar hasta 2 equipos. Sistema Suizo a 7 rondas con sedes rotativas. El equipo campeón representará a la región en el Campeonato Nacional por Equipos.",
    resultados: [
      { equipo: "Club de Ajedrez Bahía Blanca A", puntos: 6, buchholz: 10 },
      { equipo: "Círculo de Ajedrez Punta Alta", puntos: 5, buchholz: 11 },
      { equipo: "Club de Ajedrez Tres Arroyos", puntos: 4, buchholz: 9 },
      { equipo: "Círculo de Ajedrez Coronel Suárez", puntos: 3, buchholz: 8 },
      { equipo: "Club de Ajedrez Bahía Blanca B", puntos: 2, buchholz: 7 },
    ],
  },
  {
    id: "torneo-escolar-2024",
    nombre: "Torneo Escolar FASGBA",
    fecha: "Abril a Junio, 2024",
    hora: "Domingos 10:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    ritmo: "25 min + 10 seg",
    rondas: "9 (Actual: Ronda 5)",
    sistema: "Suizo",
    descripcion: "Torneo para estudiantes de escuelas primarias y secundarias de la región.",
    inscripcion: "Cerrada",
    costo: "$1000 por participante",
    imagen: "/placeholder.svg?height=400&width=600",
    bases:
      "Torneo escolar dividido en 3 categorías: Sub-10, Sub-14 y Sub-18. Sistema Suizo a 9 rondas. Ritmo de juego: 25 minutos más 10 segundos de incremento por jugada. Los ganadores de cada categoría clasifican al Torneo Provincial Escolar.",
    resultados: [
      { categoria: "Sub-10", lider: "Martín García (Escuela N°5)", puntos: 5, partidas: 5 },
      { categoria: "Sub-14", lider: "Lucía Fernández (Colegio San José)", puntos: 4.5, partidas: 5 },
      { categoria: "Sub-18", lider: "Tomás Rodríguez (Instituto Tecnológico)", puntos: 4, partidas: 5 },
    ],
  },
]

const torneosPasados = [
  {
    id: "abierto-verano-2024",
    nombre: "Abierto de Verano 2024",
    fecha: "5 al 7 de Enero, 2024",
    hora: "16:00hs",
    lugar: "Club de Ajedrez Monte Hermoso",
    direccion: "Costanera 234, Monte Hermoso",
    ritmo: "60 min + 30 seg",
    rondas: 6,
    sistema: "Suizo",
    descripcion: "Tradicional torneo de verano con participación de jugadores de todo el país.",
    ganador: "GM Laura Martínez (Club de Ajedrez Bahía Blanca)",
    imagen: "/placeholder.svg?height=400&width=600",
    resultados: [
      { posicion: 1, nombre: "GM Laura Martínez", club: "Club de Ajedrez Bahía Blanca", puntos: 5.5 },
      { posicion: 2, nombre: "IM Carlos Rodríguez", club: "Círculo de Ajedrez Punta Alta", puntos: 5 },
      { posicion: 3, nombre: "FM Martín López", club: "Club de Ajedrez Tres Arroyos", puntos: 4 },
    ],
    galeria: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
  },
  {
    id: "copa-aniversario-2023",
    nombre: "Copa Aniversario FASGBA 2023",
    fecha: "15 de Mayo, 2023",
    hora: "10:00hs",
    lugar: "Círculo de Ajedrez Pigüé",
    direccion: "Mitre 345, Pigüé",
    ritmo: "25 min + 10 seg",
    rondas: 7,
    sistema: "Suizo",
    descripcion: "Torneo semi-rápido en conmemoración del aniversario de FASGBA.",
    ganador: "IM Carlos Rodríguez (Círculo de Ajedrez Punta Alta)",
    imagen: "/placeholder.svg?height=400&width=600",
    resultados: [
      { posicion: 1, nombre: "IM Carlos Rodríguez", club: "Círculo de Ajedrez Punta Alta", puntos: 6.5 },
      { posicion: 2, nombre: "FM Martín López", club: "Club de Ajedrez Tres Arroyos", puntos: 5.5 },
      { posicion: 3, nombre: "WIM Ana García", club: "Círculo de Ajedrez Coronel Suárez", puntos: 5 },
    ],
    galeria: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
  },
  {
    id: "campeonato-regional-2023",
    nombre: "Campeonato Regional Individual 2023",
    fecha: "10 al 12 de Junio, 2023",
    hora: "10:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    ritmo: "90 min + 30 seg",
    rondas: 6,
    sistema: "Suizo",
    descripcion: "Campeonato oficial de FASGBA válido para el ranking nacional y FIDE.",
    ganador: "GM Laura Martínez (Club de Ajedrez Bahía Blanca)",
    imagen: "/placeholder.svg?height=400&width=600",
    resultados: [
      { posicion: 1, nombre: "GM Laura Martínez", club: "Club de Ajedrez Bahía Blanca", puntos: 5 },
      { posicion: 2, nombre: "IM Carlos Rodríguez", club: "Círculo de Ajedrez Punta Alta", puntos: 4.5 },
      { posicion: 3, nombre: "FM Pablo Sánchez", club: "Club de Ajedrez Monte Hermoso", puntos: 4 },
    ],
    galeria: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
  },
]

// Componente para mostrar un torneo con expansión
function TorneoCard({
  torneo,
  tipo,
  expanded,
  toggleExpand,
  expandedEnCurso,
  setExpandedEnCurso,
  expandedPasado,
  setExpandedPasado,
}) {
  return (
    <Card className={cn("border-amber/20 shadow-md transition-all duration-300", expanded ? "col-span-full" : "")}>
      <CardHeader className="pb-3 border-b border-amber/10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-terracotta">{torneo.nombre}</CardTitle>
            <CardDescription>{torneo.descripcion}</CardDescription>
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
              <span className="text-sm">{torneo.fecha}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber" />
              <span className="text-sm">{torneo.hora}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
              <div>
                <Link
                  href={`/clubes/${torneo.lugar
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")}`}
                  className="text-sm block hover:underline text-amber-dark"
                >
                  {torneo.lugar}
                </Link>
                <span className="text-sm text-muted-foreground">{torneo.direccion}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber" />
              <span className="text-sm">
                {torneo.sistema} - {torneo.rondas} rondas - {torneo.ritmo}
              </span>
            </div>
            {tipo !== "pasados" && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber" />
                <div>
                  <span className="text-sm block">Inscripción: {torneo.inscripcion}</span>
                  <span className="text-sm text-muted-foreground">Costo: {torneo.costo}</span>
                </div>
              </div>
            )}
            {tipo === "pasados" && torneo.ganador && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber" />
                <span className="text-sm font-medium">Ganador: {torneo.ganador}</span>
              </div>
            )}
          </div>

          {expanded && (
            <div className="space-y-4">
              <img
                src={torneo.imagen || "/placeholder.svg"}
                alt={`Flyer del torneo ${torneo.nombre}`}
                className="w-full rounded-lg object-cover border border-amber/20 max-h-64"
              />

              {tipo === "proximos" && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Bases del torneo:</h4>
                  <p className="text-sm text-muted-foreground">{torneo.bases}</p>
                </div>
              )}

              {tipo === "en-curso" && torneo.resultados && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Resultados parciales:</h4>
                  <div className="text-sm space-y-1">
                    {torneo.resultados.map((resultado, index) => (
                      <div key={index} className="flex justify-between border-b border-amber/10 py-1">
                        <span>{resultado.equipo || `${resultado.categoria}: ${resultado.lider}`}</span>
                        <span className="font-medium">{resultado.puntos} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tipo === "pasados" && torneo.resultados && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-terracotta">Podio:</h4>
                  <div className="text-sm space-y-1">
                    {torneo.resultados.map((resultado) => (
                      <div key={resultado.posicion} className="flex justify-between border-b border-amber/10 py-1">
                        <span>
                          {resultado.posicion}. {resultado.nombre}
                        </span>
                        <span className="font-medium">{resultado.puntos} pts</span>
                      </div>
                    ))}
                  </div>

                  {torneo.galeria && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 text-terracotta">Galería:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {torneo.galeria.map((imagen, index) => (
                          <img
                            key={index}
                            src={imagen || "/placeholder.svg"}
                            alt={`Imagen ${index + 1} del torneo ${torneo.nombre}`}
                            className="w-full h-20 object-cover rounded border border-amber/20"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {tipo === "proximos" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-terracotta hover:bg-terracotta/90 text-white">Inscripción</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-amber/20">
              <DialogHeader>
                <DialogTitle className="text-terracotta">Inscripción: {torneo.nombre}</DialogTitle>
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

        {tipo === "en-curso" && (
          <Button
            variant="outline"
            className="w-full border-amber text-amber-dark hover:bg-amber/10 hover:text-amber-dark"
            onClick={() => setExpandedEnCurso(expandedEnCurso === torneo.id ? null : torneo.id)}
          >
            {expandedEnCurso === torneo.id ? "Ocultar detalles" : "Ver detalles completos"}
          </Button>
        )}

        {tipo === "pasados" && (
          <Button
            variant="outline"
            className="w-full border-amber text-amber-dark hover:bg-amber/10 hover:text-amber-dark"
            onClick={() => setExpandedPasado(expandedPasado === torneo.id ? null : torneo.id)}
          >
            {expandedPasado === torneo.id ? "Ocultar resultados" : "Ver resultados completos"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function TorneosPage() {
  // Estado para controlar qué torneo está expandido en cada categoría
  const [expandedProximo, setExpandedProximo] = useState(null)
  const [expandedEnCurso, setExpandedEnCurso] = useState(null)
  const [expandedPasado, setExpandedPasado] = useState(null)

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
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted border border-amber/20 mb-8">
                <TabsTrigger value="proximos" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Próximos Torneos
                </TabsTrigger>
                <TabsTrigger value="en-curso" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Torneos en Curso
                </TabsTrigger>
                <TabsTrigger value="pasados" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Torneos Pasados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="proximos">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {torneosProximos.map((torneo) => (
                    <TorneoCard
                      key={torneo.id}
                      torneo={torneo}
                      tipo="proximos"
                      expanded={expandedProximo === torneo.id}
                      toggleExpand={() => setExpandedProximo(expandedProximo === torneo.id ? null : torneo.id)}
                      expandedEnCurso={expandedEnCurso}
                      setExpandedEnCurso={setExpandedEnCurso}
                      expandedPasado={expandedPasado}
                      setExpandedPasado={setExpandedPasado}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="en-curso">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {torneosEnCurso.map((torneo) => (
                    <TorneoCard
                      key={torneo.id}
                      torneo={torneo}
                      tipo="en-curso"
                      expanded={expandedEnCurso === torneo.id}
                      toggleExpand={() => setExpandedEnCurso(expandedEnCurso === torneo.id ? null : torneo.id)}
                      expandedEnCurso={expandedEnCurso}
                      setExpandedEnCurso={setExpandedEnCurso}
                      expandedPasado={expandedPasado}
                      setExpandedPasado={setExpandedPasado}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pasados">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {torneosPasados.map((torneo) => (
                    <TorneoCard
                      key={torneo.id}
                      torneo={torneo}
                      tipo="pasados"
                      expanded={expandedPasado === torneo.id}
                      toggleExpand={() => setExpandedPasado(expandedPasado === torneo.id ? null : torneo.id)}
                      expandedEnCurso={expandedEnCurso}
                      setExpandedEnCurso={setExpandedEnCurso}
                      expandedPasado={expandedPasado}
                      setExpandedPasado={setExpandedPasado}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

