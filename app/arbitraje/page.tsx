import Link from "next/link"
import { Award, BookOpen, Calendar, GraduationCap, Mail, Phone, User, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Datos de ejemplo para los árbitros
const arbitros = [
  {
    id: "juan-perez",
    nombre: "Juan Pérez",
    titulo: "Árbitro Internacional",
    club: "Club de Ajedrez Bahía Blanca",
    experiencia: "15 años",
    email: "juan.perez@fasgba.com",
    telefono: "+54 291 123-4567",
    especialidad: "Torneos Suizos y Normas Internacionales",
  },
  {
    id: "maria-rodriguez",
    nombre: "María Rodríguez",
    titulo: "Árbitro FIDE",
    club: "Círculo de Ajedrez Punta Alta",
    experiencia: "10 años",
    email: "maria.rodriguez@fasgba.com",
    telefono: "+54 291 234-5678",
    especialidad: "Torneos Juveniles y Escolares",
  },
  {
    id: "carlos-gomez",
    nombre: "Carlos Gómez",
    titulo: "Árbitro Nacional",
    club: "Club de Ajedrez Tres Arroyos",
    experiencia: "8 años",
    email: "carlos.gomez@fasgba.com",
    telefono: "+54 291 345-6789",
    especialidad: "Torneos Rápidos y Blitz",
  },
  {
    id: "laura-fernandez",
    nombre: "Laura Fernández",
    titulo: "Árbitro FIDE",
    club: "Círculo de Ajedrez Coronel Suárez",
    experiencia: "12 años",
    email: "laura.fernandez@fasgba.com",
    telefono: "+54 291 456-7890",
    especialidad: "Torneos por Equipos y Round Robin",
  },
  {
    id: "roberto-martinez",
    nombre: "Roberto Martínez",
    titulo: "Árbitro Nacional",
    club: "Club de Ajedrez Monte Hermoso",
    experiencia: "6 años",
    email: "roberto.martinez@fasgba.com",
    telefono: "+54 291 567-8901",
    especialidad: "Torneos Escolares y Formativos",
  },
  {
    id: "ana-lopez",
    nombre: "Ana López",
    titulo: "Árbitro Regional",
    club: "Círculo de Ajedrez Pigüé",
    experiencia: "4 años",
    email: "ana.lopez@fasgba.com",
    telefono: "+54 291 678-9012",
    especialidad: "Torneos Infantiles",
  },
]

// Datos de ejemplo para los cursos de arbitraje
const cursos = [
  {
    id: "curso-arbitro-regional",
    titulo: "Curso de Árbitro Regional",
    fecha: "15-16 de Julio, 2024",
    lugar: "Club de Ajedrez Bahía Blanca",
    instructor: "Juan Pérez (Árbitro Internacional)",
    duracion: "16 horas",
    descripcion: "Curso básico para la formación de árbitros regionales con certificación de FASGBA.",
  },
  {
    id: "curso-arbitro-nacional",
    titulo: "Curso de Árbitro Nacional",
    fecha: "10-12 de Agosto, 2024",
    lugar: "Círculo de Ajedrez Punta Alta",
    instructor: "María Rodríguez (Árbitro FIDE)",
    duracion: "24 horas",
    descripcion: "Formación avanzada para árbitros regionales que deseen obtener la categoría nacional.",
  },
  {
    id: "seminario-actualizacion",
    titulo: "Seminario de Actualización Reglamentaria",
    fecha: "5 de Septiembre, 2024",
    lugar: "Online (Zoom)",
    instructor: "Carlos Gómez (Árbitro Nacional)",
    duracion: "4 horas",
    descripcion: "Actualización sobre los cambios recientes en las leyes del ajedrez y reglamentos FIDE.",
  },
]

export default function ArbitrajePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/arbitraje" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Arbitraje</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Árbitros oficiales y cursos de formación de la Federación de Ajedrez del Sur del Gran Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Árbitros Oficiales</h2>
              <p className="text-muted-foreground">
                Listado de árbitros habilitados por FASGBA para dirigir torneos oficiales
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arbitros.map((arbitro) => (
                <Card key={arbitro.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {arbitro.nombre}
                    </CardTitle>
                    <CardDescription>{arbitro.titulo}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Experiencia: {arbitro.experiencia}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Especialidad: {arbitro.especialidad}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{arbitro.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{arbitro.telefono}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/arbitraje/${arbitro.id}`}>Ver Perfil</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Cursos de Formación</h2>
              <p className="text-muted-foreground">
                Próximos cursos y seminarios para la formación y actualización de árbitros
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {cursos.map((curso) => (
                <Card key={curso.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{curso.titulo}</CardTitle>
                    <CardDescription>{curso.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{curso.fecha}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Instructor: {curso.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Duración: {curso.duracion}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/arbitraje/cursos/${curso.id}`}>Inscripción</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-6">Comité de Árbitros</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Funciones del Comité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Designación de árbitros para torneos oficiales de FASGBA</li>
                      <li>Evaluación y certificación de nuevos árbitros</li>
                      <li>Organización de cursos y seminarios de formación</li>
                      <li>Actualización de reglamentos y normativas</li>
                      <li>Asesoramiento técnico a clubes y organizadores</li>
                      <li>Resolución de consultas reglamentarias</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-6">Recursos para Árbitros</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos y Herramientas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Documentos Oficiales</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <Link href="/reglamentos/fide" className="text-primary hover:underline">
                              Leyes del Ajedrez FIDE
                            </Link>
                          </li>
                          <li>
                            <Link href="/reglamentos/fasgba" className="text-primary hover:underline">
                              Reglamento de Torneos FASGBA
                            </Link>
                          </li>
                          <li>
                            <Link href="/reglamentos/arbitros" className="text-primary hover:underline">
                              Manual del Árbitro
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Software y Herramientas</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <Link href="/arbitraje/recursos/swiss-manager" className="text-primary hover:underline">
                              Swiss Manager (gestión de torneos)
                            </Link>
                          </li>
                          <li>
                            <Link href="/arbitraje/recursos/vega" className="text-primary hover:underline">
                              Vega (alternativa gratuita)
                            </Link>
                          </li>
                          <li>
                            <Link href="/arbitraje/recursos/lichess" className="text-primary hover:underline">
                              Herramientas para torneos online
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/arbitraje/recursos">Ver Todos los Recursos</Link>
                    </Button>
                  </CardFooter>
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

