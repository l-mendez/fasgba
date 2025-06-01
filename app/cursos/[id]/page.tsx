"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, ChevronLeft, Clock, MapPin, Users, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

// Datos de ejemplo para los cursos
const cursos = [
  {
    id: "iniciacion-ajedrez",
    titulo: "Iniciación al Ajedrez",
    descripcion: "Curso básico para quienes desean aprender a jugar ajedrez desde cero.",
    nivel: "Principiante",
    categoria: "general",
    instructor: {
      nombre: "Carlos Rodríguez",
      titulo: "IM",
      club: "Círculo de Ajedrez Punta Alta",
      avatar: "/placeholder.svg?height=80&width=80",
      bio: "Maestro Internacional con más de 15 años de experiencia en la enseñanza del ajedrez. Especializado en formación de jugadores principiantes y de nivel intermedio. Director de la Escuela de Ajedrez del Círculo de Ajedrez Punta Alta desde 2010.",
    },
    fechaInicio: "10 de Abril, 2025",
    fechaFin: "15 de Mayo, 2025",
    horario: "Martes y Jueves, 18:00 - 19:30hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    modalidad: "Presencial",
    precio: "$15.000",
    cupos: 15,
    cuposDisponibles: 8,
    imagen: "/placeholder.svg?height=400&width=600&text=Iniciación+al+Ajedrez",
    temas: [
      "Movimiento de las piezas",
      "Reglas básicas",
      "Notación algebraica",
      "Conceptos tácticos elementales",
      "Mates básicos",
    ],
    requisitos: ["No se requieren conocimientos previos", "Edad mínima: 12 años", "Traer tablero y piezas (opcional)"],
    incluye: ["Material didáctico digital", "Acceso a plataforma de ejercicios online", "Certificado de participación"],
    cronograma: [
      {
        semana: "Semana 1",
        temas: "Introducción al ajedrez. Tablero y piezas. Movimientos básicos.",
      },
      {
        semana: "Semana 2",
        temas: "Reglas especiales: enroque, captura al paso, promoción. Notación algebraica.",
      },
      {
        semana: "Semana 3",
        temas: "Valor de las piezas. Conceptos tácticos básicos: clavada, horquilla, descubierta.",
      },
      {
        semana: "Semana 4",
        temas: "Mates básicos: mate de dama, mate de torre, mate de dos alfiles.",
      },
      {
        semana: "Semana 5",
        temas: "Principios de apertura. Finales básicos. Torneo de práctica.",
      },
    ],
    destacado: true,
  },
  {
    id: "tactica-intermedia",
    titulo: "Táctica para Nivel Intermedio",
    descripcion: "Mejora tus habilidades tácticas con ejercicios y conceptos de nivel intermedio.",
    nivel: "Intermedio",
    categoria: "general",
    instructor: {
      nombre: "Laura Martínez",
      titulo: "GM",
      club: "Club de Ajedrez Bahía Blanca",
      avatar: "/placeholder.svg?height=80&width=80",
      bio: "Gran Maestra de ajedrez con amplia experiencia en competiciones internacionales. Campeona argentina en múltiples ocasiones y entrenadora de jóvenes talentos. Su especialidad es la táctica y los ataques al rey.",
    },
    fechaInicio: "5 de Mayo, 2025",
    fechaFin: "30 de Junio, 2025",
    horario: "Lunes y Miércoles, 19:00 - 21:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    modalidad: "Presencial",
    precio: "$20.000",
    cupos: 12,
    cuposDisponibles: 5,
    imagen: "/placeholder.svg?height=400&width=600&text=Táctica+Intermedia",
    temas: ["Combinaciones tácticas", "Sacrificios", "Ataques al rey", "Defensas tácticas", "Ejercicios prácticos"],
    requisitos: [
      "Conocimiento básico de ajedrez",
      "ELO mínimo recomendado: 1400",
      "Traer tablero y piezas",
      "Cuaderno para anotaciones",
    ],
    incluye: [
      "Material didáctico digital",
      "Acceso a plataforma de ejercicios online",
      "Análisis personalizado de partidas",
      "Certificado de participación",
    ],
    cronograma: [
      {
        semana: "Semana 1-2",
        temas: "Combinaciones tácticas: doble ataque, clavada, descubierta, rayos X.",
      },
      {
        semana: "Semana 3-4",
        temas: "Sacrificios: sacrificio de calidad, sacrificio posicional, sacrificio de dama.",
      },
      {
        semana: "Semana 5-6",
        temas: "Ataques al rey: ataque en el centro, ataque en el flanco de rey, sacrificios de ataque.",
      },
      {
        semana: "Semana 7-8",
        temas: "Defensas tácticas: contraataque, simplificación, defensa activa.",
      },
      {
        semana: "Semana 9",
        temas: "Torneo práctico y análisis de partidas.",
      },
    ],
    destacado: true,
  },
  {
    id: "ajedrez-infantil",
    titulo: "Ajedrez para Niños",
    descripcion:
      "Curso especialmente diseñado para niños de 6 a 12 años que quieren aprender ajedrez de forma divertida.",
    nivel: "Principiante",
    categoria: "infantil",
    instructor: {
      nombre: "Ana García",
      titulo: "WIM",
      club: "Círculo de Ajedrez Coronel Suárez",
      avatar: "/placeholder.svg?height=80&width=80",
      bio: "Maestra Internacional Femenina especializada en enseñanza de ajedrez para niños. Con más de 10 años de experiencia en educación ajedrecística, ha desarrollado una metodología lúdica que facilita el aprendizaje en edades tempranas.",
    },
    fechaInicio: "15 de Abril, 2025",
    fechaFin: "30 de Mayo, 2025",
    horario: "Sábados, 10:00 - 12:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    direccion: "Av. Colón 123, Bahía Blanca",
    modalidad: "Presencial",
    precio: "$12.000",
    cupos: 15,
    cuposDisponibles: 7,
    imagen: "/placeholder.svg?height=400&width=600&text=Ajedrez+Infantil",
    temas: [
      "Aprendizaje lúdico de las reglas",
      "Ejercicios adaptados para niños",
      "Juegos didácticos",
      "Mini-torneos",
      "Desarrollo del pensamiento lógico",
    ],
    requisitos: ["Edad: 6 a 12 años", "No se requieren conocimientos previos"],
    incluye: [
      "Material didáctico impreso",
      "Tablero y piezas para usar durante las clases",
      "Merienda",
      "Diploma de participación",
      "Medalla al finalizar el curso",
    ],
    cronograma: [
      {
        semana: "Semana 1",
        temas: "Introducción al tablero y las piezas. Juegos de reconocimiento.",
      },
      {
        semana: "Semana 2",
        temas: "Movimientos de las piezas. Juegos de captura.",
      },
      {
        semana: "Semana 3",
        temas: "Reglas especiales. Juegos de estrategia básica.",
      },
      {
        semana: "Semana 4",
        temas: "Mates básicos. Juegos de ataque y defensa.",
      },
      {
        semana: "Semana 5",
        temas: "Mini-torneo con premios y entrega de diplomas.",
      },
    ],
    destacado: true,
  },
]

export default function CursoDetailPage({ params }: { params: { id: string } }) {
  const curso = cursos.find((c) => c.id === params.id)
  const [inscripcionExitosa, setInscripcionExitosa] = useState(false)

  if (!curso) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta mb-4">Curso no encontrado</h1>
            <p className="text-muted-foreground mb-6">El curso que estás buscando no existe o ha sido eliminado.</p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Link href="/cursos">Volver a cursos</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const handleInscripcion = () => {
    // Aquí iría la lógica para procesar la inscripción
    setInscripcionExitosa(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Imagen de cabecera */}
        <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full">
          <img src={curso.imagen || "/placeholder.svg"} alt={curso.titulo} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>

        {/* Contenido principal */}
        <div className="container px-4 md:px-6 -mt-20 relative z-10">
          <div className="mx-auto max-w-5xl bg-background rounded-lg border border-amber/20 shadow-lg p-6 md:p-10">
            <Button asChild variant="outline" size="sm" className="mb-6 border-amber text-amber-dark hover:bg-amber/10">
              <Link href="/cursos">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a cursos
              </Link>
            </Button>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber text-white hover:bg-amber/90">{curso.nivel}</Badge>
                  <Badge variant="outline" className="border-amber/20 text-muted-foreground">
                    {curso.modalidad}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{curso.titulo}</h1>
                <p className="mt-2 text-muted-foreground">{curso.descripcion}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-3xl font-bold text-terracotta">{curso.precio}</div>
                <div className="text-sm text-muted-foreground mb-4">Precio por alumno</div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto bg-terracotta hover:bg-terracotta/90 text-white">
                      Inscribirme
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] border-amber/20">
                    {!inscripcionExitosa ? (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-terracotta">Inscripción: {curso.titulo}</DialogTitle>
                          <DialogDescription>Complete el formulario para inscribirse en el curso.</DialogDescription>
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
                          {curso.categoria === "infantil" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="edad" className="text-right text-sm font-medium">
                                Edad
                              </label>
                              <input
                                id="edad"
                                type="number"
                                className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Edad del niño/a"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="club" className="text-right text-sm font-medium">
                              Club
                            </label>
                            <input
                              id="club"
                              className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Club al que pertenece (opcional)"
                            />
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
                          <Button
                            className="bg-terracotta hover:bg-terracotta/90 text-white"
                            onClick={handleInscripcion}
                          >
                            Confirmar inscripción
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 flex flex-col items-center text-center">
                        <div className="rounded-full bg-green-100 p-3 mb-4">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl text-terracotta mb-2">¡Inscripción exitosa!</DialogTitle>
                        <DialogDescription className="mb-6">
                          Tu inscripción al curso <span className="font-medium">{curso.titulo}</span> ha sido recibida.
                          Te hemos enviado un email con los detalles del pago y próximos pasos.
                        </DialogDescription>
                        <DialogClose asChild>
                          <Button className="bg-terracotta hover:bg-terracotta/90 text-white">Cerrar</Button>
                        </DialogClose>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber" />
                <div>
                  <p className="text-sm font-medium">Fechas</p>
                  <p className="text-sm text-muted-foreground">
                    {curso.fechaInicio} al {curso.fechaFin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber" />
                <div>
                  <p className="text-sm font-medium">Horario</p>
                  <p className="text-sm text-muted-foreground">{curso.horario}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Lugar</p>
                  <p className="text-sm text-muted-foreground">{curso.lugar}</p>
                  <p className="text-sm text-muted-foreground">{curso.direccion}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="detalles" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted border border-amber/20 mb-6">
                <TabsTrigger value="detalles" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="instructor" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Instructor
                </TabsTrigger>
                <TabsTrigger value="cronograma" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Cronograma
                </TabsTrigger>
                <TabsTrigger value="requisitos" className="data-[state=active]:bg-amber data-[state=active]:text-white">
                  Requisitos
                </TabsTrigger>
              </TabsList>

              {/* Pestaña de Detalles */}
              <TabsContent value="detalles">
                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Temas del curso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {curso.temas.map((tema, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber mt-1.5"></div>
                          <span className="text-muted-foreground">{tema}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber/20 mt-6">
                  <CardHeader>
                    <CardTitle className="text-terracotta">El curso incluye</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {curso.incluye.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-between bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-amber" />
                    <div>
                      <p className="text-sm font-medium">Cupos limitados</p>
                      <p className="text-sm text-muted-foreground">
                        {curso.cuposDisponibles} disponibles de {curso.cupos}
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-terracotta hover:bg-terracotta/90 text-white">Inscribirme</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-amber/20">
                      {!inscripcionExitosa ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="text-terracotta">Inscripción: {curso.titulo}</DialogTitle>
                            <DialogDescription>Complete el formulario para inscribirse en el curso.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="nombre-modal" className="text-right text-sm font-medium">
                                Nombre
                              </label>
                              <input
                                id="nombre-modal"
                                className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Nombre completo"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="email-modal" className="text-right text-sm font-medium">
                                Email
                              </label>
                              <input
                                id="email-modal"
                                type="email"
                                className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="correo@ejemplo.com"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="telefono-modal" className="text-right text-sm font-medium">
                                Teléfono
                              </label>
                              <input
                                id="telefono-modal"
                                className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="+54 291 123-4567"
                              />
                            </div>
                            {curso.categoria === "infantil" && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="edad-modal" className="text-right text-sm font-medium">
                                  Edad
                                </label>
                                <input
                                  id="edad-modal"
                                  type="number"
                                  className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Edad del niño/a"
                                />
                              </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="club-modal" className="text-right text-sm font-medium">
                                Club
                              </label>
                              <input
                                id="club-modal"
                                className="col-span-3 flex h-10 w-full rounded-md border border-amber/20 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Club al que pertenece (opcional)"
                              />
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
                            <Button
                              className="bg-terracotta hover:bg-terracotta/90 text-white"
                              onClick={handleInscripcion}
                            >
                              Confirmar inscripción
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="py-6 flex flex-col items-center text-center">
                          <div className="rounded-full bg-green-100 p-3 mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <DialogTitle className="text-xl text-terracotta mb-2">¡Inscripción exitosa!</DialogTitle>
                          <DialogDescription className="mb-6">
                            Tu inscripción al curso <span className="font-medium">{curso.titulo}</span> ha sido
                            recibida. Te hemos enviado un email con los detalles del pago y próximos pasos.
                          </DialogDescription>
                          <DialogClose asChild>
                            <Button className="bg-terracotta hover:bg-terracotta/90 text-white">Cerrar</Button>
                          </DialogClose>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>

              {/* Pestaña de Instructor */}
              <TabsContent value="instructor">
                <Card className="border-amber/20">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={curso.instructor.avatar} alt={curso.instructor.nombre} />
                        <AvatarFallback className="bg-amber/10 text-amber-dark text-xl">
                          {curso.instructor.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-terracotta flex items-center gap-2">
                          {curso.instructor.titulo && (
                            <Badge className="bg-amber text-white">{curso.instructor.titulo}</Badge>
                          )}
                          {curso.instructor.nombre}
                        </CardTitle>
                        <CardDescription>
                          <Link
                            href={`/clubes/${curso.instructor.club
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")}`}
                            className="text-amber-dark hover:underline"
                          >
                            {curso.instructor.club}
                          </Link>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{curso.instructor.bio}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña de Cronograma */}
              <TabsContent value="cronograma">
                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Cronograma del curso</CardTitle>
                    <CardDescription>Planificación semanal de contenidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {curso.cronograma.map((item, index) => (
                        <div key={index} className="border-b border-amber/10 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium text-terracotta">{item.semana}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.temas}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña de Requisitos */}
              <TabsContent value="requisitos">
                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Requisitos</CardTitle>
                    <CardDescription>Lo que necesitas para participar en este curso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {curso.requisitos.map((requisito, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber mt-1.5"></div>
                          <span className="text-muted-foreground">{requisito}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Cursos relacionados */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Cursos relacionados</h2>
              <p className="mt-2 text-muted-foreground">Otros cursos que podrían interesarte</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {cursos
                .filter((c) => c.id !== curso.id && c.categoria === curso.categoria)
                .slice(0, 3)
                .map((cursoRelacionado) => (
                  <Card key={cursoRelacionado.id} className="flex flex-col group hover:border-amber transition-colors">
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={cursoRelacionado.imagen || "/placeholder.svg"}
                        alt={cursoRelacionado.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-terracotta">{cursoRelacionado.titulo}</CardTitle>
                        <Badge className="bg-amber text-white hover:bg-amber/90">{cursoRelacionado.nivel}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground mb-4">{cursoRelacionado.descripcion}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber" />
                        <span className="text-sm">{cursoRelacionado.fechaInicio}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full bg-terracotta hover:bg-terracotta/90 text-white">
                        <Link href={`/cursos/${cursoRelacionado.id}`}>Ver detalles</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

