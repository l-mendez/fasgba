import Link from "next/link"
import { Mail, MapPin, Phone, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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
  },
]

export default function ClubesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Clubes Afiliados</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conoce los clubes que forman parte de la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Directorio de Clubes</h2>
                  <p className="text-muted-foreground">
                    Encuentra información detallada sobre cada club afiliado a FASGBA
                  </p>
                </div>
                <div className="w-full md:w-1/3">
                  <Input type="search" placeholder="Buscar club..." className="w-full" />
                </div>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clubes.map((club) => (
                <Card key={club.id} className="flex flex-col group hover:border-amber transition-colors">
                  <CardHeader>
                    <CardTitle>
                      <Link href={`/clubes/${club.id}`} className="text-terracotta hover:underline">
                        {club.nombre}
                      </Link>
                    </CardTitle>
                    <CardDescription>{club.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm">{club.direccion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{club.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{club.email}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Horarios de actividad:</h4>
                        <p className="text-sm text-muted-foreground">{club.horarios}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Delegado:</h4>
                        <p className="text-sm text-muted-foreground">{club.delegado}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button asChild className="w-full">
                      <Link href={`/clubes/${club.id}`}>Ver Detalle</Link>
                    </Button>
                    <Button variant="outline" size="icon" className="border-amber text-amber-dark hover:bg-amber/10">
                      <Heart className="h-4 w-4" />
                      <span className="sr-only">Seguir club</span>
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

