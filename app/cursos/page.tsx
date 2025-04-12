import Link from "next/link"
import { Calendar, Clock, Filter, GraduationCap, MapPin, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    },
    fechaInicio: "10 de Abril, 2025",
    fechaFin: "15 de Mayo, 2025",
    horario: "Martes y Jueves, 18:00 - 19:30hs",
    lugar: "Club de Ajedrez Bahía Blanca",
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
    },
    fechaInicio: "5 de Mayo, 2025",
    fechaFin: "30 de Junio, 2025",
    horario: "Lunes y Miércoles, 19:00 - 21:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    modalidad: "Presencial",
    precio: "$20.000",
    cupos: 12,
    cuposDisponibles: 5,
    imagen: "/placeholder.svg?height=400&width=600&text=Táctica+Intermedia",
    temas: ["Combinaciones tácticas", "Sacrificios", "Ataques al rey", "Defensas tácticas", "Ejercicios prácticos"],
    destacado: true,
  },
  {
    id: "finales-avanzados",
    titulo: "Finales Avanzados",
    descripcion: "Domina los finales más complejos y mejora tu comprensión estratégica del juego.",
    nivel: "Avanzado",
    categoria: "general",
    instructor: {
      nombre: "Martín López",
      titulo: "FM",
      club: "Club de Ajedrez Tres Arroyos",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    fechaInicio: "3 de Junio, 2025",
    fechaFin: "22 de Julio, 2025",
    horario: "Viernes, 18:00 - 21:00hs",
    lugar: "Círculo de Ajedrez Punta Alta",
    modalidad: "Presencial",
    precio: "$25.000",
    cupos: 10,
    cuposDisponibles: 3,
    imagen: "/placeholder.svg?height=400&width=600&text=Finales+Avanzados",
    temas: [
      "Finales de peones",
      "Finales de torres",
      "Finales de piezas menores",
      "Posiciones teóricas clave",
      "Análisis de partidas magistrales",
    ],
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
    },
    fechaInicio: "15 de Abril, 2025",
    fechaFin: "30 de Mayo, 2025",
    horario: "Sábados, 10:00 - 12:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
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
    destacado: true,
  },
  {
    id: "aperturas-espanola-italiana",
    titulo: "Aperturas: Española e Italiana",
    descripcion: "Estudio profundo de las aperturas española e italiana, sus variantes y planes estratégicos.",
    nivel: "Intermedio",
    categoria: "aperturas",
    instructor: {
      nombre: "Pablo Sánchez",
      titulo: "FM",
      club: "Club de Ajedrez Monte Hermoso",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    fechaInicio: "20 de Mayo, 2025",
    fechaFin: "24 de Junio, 2025",
    horario: "Martes, 19:00 - 21:00hs",
    lugar: "Online (Zoom)",
    modalidad: "Online",
    precio: "$18.000",
    cupos: 20,
    cuposDisponibles: 12,
    imagen: "/placeholder.svg?height=400&width=600&text=Aperturas+Española+e+Italiana",
    temas: [
      "Apertura Española: variantes principales",
      "Apertura Italiana: variantes principales",
      "Planes estratégicos para blancas",
      "Planes estratégicos para negras",
      "Análisis de partidas modelo",
    ],
  },
  {
    id: "curso-arbitraje-regional",
    titulo: "Curso de Árbitro Regional",
    descripcion: "Formación oficial para obtener el título de Árbitro Regional de FASGBA.",
    nivel: "Todos los niveles",
    categoria: "arbitraje",
    instructor: {
      nombre: "Roberto Martínez",
      titulo: "Árbitro Nacional",
      club: "Club de Ajedrez Monte Hermoso",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    fechaInicio: "15 de Julio, 2025",
    fechaFin: "16 de Julio, 2025",
    horario: "Sábado y Domingo, 9:00 - 18:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    modalidad: "Presencial",
    precio: "$30.000",
    cupos: 20,
    cuposDisponibles: 15,
    imagen: "/placeholder.svg?height=400&width=600&text=Curso+de+Arbitraje",
    temas: [
      "Leyes del Ajedrez FIDE",
      "Sistemas de competición",
      "Uso de software de emparejamientos",
      "Gestión de torneos",
      "Evaluación práctica",
    ],
  },
  {
    id: "defensa-siciliana",
    titulo: "Defensa Siciliana: Variante Najdorf",
    descripcion: "Estudio detallado de la Defensa Siciliana, con énfasis en la Variante Najdorf.",
    nivel: "Avanzado",
    categoria: "aperturas",
    instructor: {
      nombre: "Lucía Fernández",
      titulo: "WFM",
      club: "Círculo de Ajedrez Pigüé",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    fechaInicio: "7 de Junio, 2025",
    fechaFin: "12 de Julio, 2025",
    horario: "Sábados, 16:00 - 18:00hs",
    lugar: "Online (Zoom)",
    modalidad: "Online",
    precio: "$22.000",
    cupos: 15,
    cuposDisponibles: 9,
    imagen: "/placeholder.svg?height=400&width=600&text=Defensa+Siciliana",
    temas: [
      "Introducción a la Siciliana",
      "Variante Najdorf: ideas principales",
      "Ataques típicos de las blancas",
      "Planes defensivos y contraataques",
      "Análisis de partidas recientes",
    ],
  },
  {
    id: "ajedrez-escolar",
    titulo: "Ajedrez Escolar para Docentes",
    descripcion: "Curso dirigido a docentes que desean implementar el ajedrez como herramienta pedagógica.",
    nivel: "Principiante",
    categoria: "especial",
    instructor: {
      nombre: "María López",
      titulo: "Profesora",
      club: "Círculo de Ajedrez Coronel Suárez",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    fechaInicio: "10 de Agosto, 2025",
    fechaFin: "14 de Septiembre, 2025",
    horario: "Domingos, 10:00 - 13:00hs",
    lugar: "Club de Ajedrez Bahía Blanca",
    modalidad: "Presencial",
    precio: "$16.000",
    cupos: 20,
    cuposDisponibles: 18,
    imagen: "/placeholder.svg?height=400&width=600&text=Ajedrez+Escolar",
    temas: [
      "Fundamentos del ajedrez",
      "Ajedrez como herramienta pedagógica",
      "Diseño de actividades para el aula",
      "Evaluación del progreso",
      "Organización de torneos escolares",
    ],
  },
]

// Testimonios de alumnos
const testimonios = [
  {
    id: 1,
    nombre: "Juan Pérez",
    curso: "Iniciación al Ajedrez",
    texto:
      "Excelente curso para principiantes. El profesor explica con mucha claridad y paciencia. Ahora puedo jugar partidas completas y entender los conceptos básicos.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 2,
    nombre: "Sofía Rodríguez",
    curso: "Táctica para Nivel Intermedio",
    texto:
      "Increíble la cantidad de conceptos tácticos que aprendí. Mi juego mejoró notablemente y ahora puedo ver combinaciones que antes pasaba por alto.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    nombre: "Martín González",
    curso: "Finales Avanzados",
    texto:
      "Un curso muy completo que me ayudó a entender la importancia de los finales. El material didáctico es excelente y las explicaciones del instructor son muy claras.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
]

// Preguntas frecuentes
const faq = [
  {
    pregunta: "¿Necesito tener conocimientos previos para inscribirme en un curso?",
    respuesta:
      "Depende del curso. Los cursos de nivel principiante no requieren conocimientos previos, mientras que los de nivel intermedio y avanzado sí requieren cierta experiencia en ajedrez. En la descripción de cada curso se especifica el nivel requerido.",
  },
  {
    pregunta: "¿Cómo se realizan los pagos?",
    respuesta:
      "Los pagos se pueden realizar por transferencia bancaria, depósito o en efectivo en la sede de FASGBA. Una vez realizado el pago, debes enviar el comprobante por email para confirmar tu inscripción.",
  },
  {
    pregunta: "¿Qué sucede si no puedo asistir a alguna clase?",
    respuesta:
      "Las clases presenciales no se recuperan individualmente, pero se proporciona el material de la clase y, en algunos casos, grabaciones para que puedas ponerte al día. En los cursos online, se envían las grabaciones a todos los participantes.",
  },
  {
    pregunta: "¿Se entrega certificado al finalizar el curso?",
    respuesta:
      "Sí, todos nuestros cursos incluyen un certificado digital de participación. Los cursos oficiales, como el de Árbitro Regional, otorgan una certificación oficial de FASGBA.",
  },
  {
    pregunta: "¿Hay descuentos para socios de clubes afiliados?",
    respuesta:
      "Sí, los socios de clubes afiliados a FASGBA tienen un 15% de descuento en todos los cursos. Deberás presentar tu credencial de socio al momento de la inscripción.",
  },
]

export default function CursosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Cursos y Formación</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Mejora tus habilidades ajedrecísticas con los cursos oficiales de la Federación de Ajedrez del Sur de
                  Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cursos destacados */}
        <section className="w-full py-12 md:py-16 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Cursos Destacados</h2>
              <p className="mt-2 text-muted-foreground">Nuestras propuestas más populares</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cursos
                .filter((curso) => curso.destacado)
                .map((curso) => (
                  <Card key={curso.id} className="flex flex-col group hover:border-amber transition-colors">
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={curso.imagen || "/placeholder.svg"}
                        alt={curso.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-terracotta">{curso.titulo}</CardTitle>
                          <CardDescription>{curso.descripcion}</CardDescription>
                        </div>
                        <Badge className="bg-amber text-white hover:bg-amber/90">{curso.nivel}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-amber" />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={curso.instructor.avatar} alt={curso.instructor.nombre} />
                              <AvatarFallback className="bg-amber/10 text-amber-dark text-xs">
                                {curso.instructor.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {curso.instructor.titulo && (
                                <span className="font-medium">{curso.instructor.titulo} </span>
                              )}
                              {curso.instructor.nombre}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber" />
                          <span className="text-sm">
                            {curso.fechaInicio} al {curso.fechaFin}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber" />
                          <span className="text-sm">{curso.horario}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                          <span className="text-sm">{curso.lugar}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-amber" />
                          <span className="text-sm">
                            Cupos: {curso.cuposDisponibles} disponibles de {curso.cupos}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-lg font-bold text-terracotta">{curso.precio}</span>
                        <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                          <Link href={`/cursos/${curso.id}`}>Ver detalles</Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        </section>

        {/* Listado de cursos */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-terracotta">Todos los Cursos</h2>
                <p className="text-muted-foreground">Explora nuestra oferta completa de cursos y talleres</p>
              </div>
              <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar curso..." className="pl-8 w-full md:w-[250px]" />
                </div>
                <Button variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>

            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:w-[800px]">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="infantil">Infantil</TabsTrigger>
                <TabsTrigger value="aperturas">Aperturas</TabsTrigger>
                <TabsTrigger value="arbitraje">Arbitraje</TabsTrigger>
                <TabsTrigger value="especial">Especiales</TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cursos.map((curso) => (
                    <Card key={curso.id} className="flex flex-col group hover:border-amber transition-colors">
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={curso.imagen || "/placeholder.svg"}
                          alt={curso.titulo}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-terracotta">{curso.titulo}</CardTitle>
                            <CardDescription>{curso.descripcion}</CardDescription>
                          </div>
                          <Badge className="bg-amber text-white hover:bg-amber/90">{curso.nivel}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-amber" />
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={curso.instructor.avatar} alt={curso.instructor.nombre} />
                                <AvatarFallback className="bg-amber/10 text-amber-dark text-xs">
                                  {curso.instructor.nombre
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {curso.instructor.titulo && (
                                  <span className="font-medium">{curso.instructor.titulo} </span>
                                )}
                                {curso.instructor.nombre}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber" />
                            <span className="text-sm">
                              {curso.fechaInicio} al {curso.fechaFin}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-sm">{curso.horario}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                            <span className="text-sm">{curso.lugar}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber" />
                            <span className="text-sm">
                              Cupos: {curso.cuposDisponibles} disponibles de {curso.cupos}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex w-full items-center justify-between">
                          <span className="text-lg font-bold text-terracotta">{curso.precio}</span>
                          <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                            <Link href={`/cursos/${curso.id}`}>Ver detalles</Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Contenido para cada categoría */}
              {["general", "infantil", "aperturas", "arbitraje", "especial"].map((categoria) => (
                <TabsContent key={categoria} value={categoria} className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cursos
                      .filter((curso) => curso.categoria === categoria)
                      .map((curso) => (
                        <Card key={curso.id} className="flex flex-col group hover:border-amber transition-colors">
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img
                              src={curso.imagen || "/placeholder.svg"}
                              alt={curso.titulo}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-terracotta">{curso.titulo}</CardTitle>
                                <CardDescription>{curso.descripcion}</CardDescription>
                              </div>
                              <Badge className="bg-amber text-white hover:bg-amber/90">{curso.nivel}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-amber" />
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={curso.instructor.avatar} alt={curso.instructor.nombre} />
                                    <AvatarFallback className="bg-amber/10 text-amber-dark text-xs">
                                      {curso.instructor.nombre
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {curso.instructor.titulo && (
                                      <span className="font-medium">{curso.instructor.titulo} </span>
                                    )}
                                    {curso.instructor.nombre}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber" />
                                <span className="text-sm">
                                  {curso.fechaInicio} al {curso.fechaFin}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber" />
                                <span className="text-sm">{curso.horario}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                                <span className="text-sm">{curso.lugar}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-amber" />
                                <span className="text-sm">
                                  Cupos: {curso.cuposDisponibles} disponibles de {curso.cupos}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <div className="flex w-full items-center justify-between">
                              <span className="text-lg font-bold text-terracotta">{curso.precio}</span>
                              <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                                <Link href={`/cursos/${curso.id}`}>Ver detalles</Link>
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Testimonios */}
        <section className="w-full py-12 md:py-16 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Testimonios</h2>
              <p className="mt-2 text-muted-foreground">Lo que dicen nuestros alumnos</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonios.map((testimonio) => (
                <Card key={testimonio.id} className="border-amber/20">
                  <CardContent className="pt-6">
                    <blockquote className="border-l-2 pl-4 italic">"{testimonio.texto}"</blockquote>
                    <div className="mt-4 flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={testimonio.avatar} alt={testimonio.nombre} />
                        <AvatarFallback className="bg-amber/10 text-amber-dark">
                          {testimonio.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{testimonio.nombre}</p>
                        <p className="text-sm text-muted-foreground">Curso: {testimonio.curso}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Preguntas Frecuentes</h2>
              <p className="mt-2 text-muted-foreground">Respuestas a las consultas más comunes sobre nuestros cursos</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {faq.map((item, index) => (
                <Card key={index} className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-terracotta">{item.pregunta}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.respuesta}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-12 md:py-16 bg-gradient-to-b from-amber/5 to-terracotta/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">
                  ¿Listo para mejorar tu ajedrez?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                  Inscríbete ahora y comienza tu camino hacia la maestría
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white">
                  <Link href="/cursos#todos">Ver todos los cursos</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/contacto">Consultas</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

