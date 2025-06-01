import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"
import { ReactNode } from "react"
import type { Metadata } from 'next'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  description: 'Federación de Ajedrez del Sur de Buenos Aires - Promoviendo el ajedrez en la región sur de Buenos Aires desde 1985',
}

interface Noticia {
  id: string
  titulo: string
  fecha: string
  imagen: string
  categorias: string[]
  extracto: string
  destacada?: boolean
}

interface NoticiaProps {
  noticia: Noticia
}

// Datos de ejemplo para las noticias
const noticias: Noticia[] = [
  {
    id: "nueva-entidad-bahia-blanca",
    titulo: "Bahía Blanca suma una nueva entidad al ajedrez federado regional",
    fecha: "marzo 27, 2025",
    imagen: "/placeholder.svg?height=600&width=800",
    categorias: ["Entidades Afiliadas", "Noticias 2025", "Noticias Destacadas"],
    extracto:
      "El Club Social y Deportivo Villa Mitre se suma a la familia de FASGBA, ampliando la oferta de ajedrez en la región sur de Buenos Aires.",
    destacada: true,
  },
  {
    id: "torneo-memoria-verdad-justicia",
    titulo: "Ajedrez por la memoria verdad y justicia",
    fecha: "marzo 27, 2025",
    imagen: "/placeholder.svg?height=400&width=600",
    categorias: ["Noticias 2025", "Noticias Destacadas", "Presencia Institucional", "Torneos en Argentina"],
    extracto:
      "FASGBA organizó un torneo conmemorativo por el Día Nacional de la Memoria por la Verdad y la Justicia con gran participación de la comunidad.",
  },
  {
    id: "club-patriotas-punta-alta",
    titulo: "Nueva entidad se suma a FASGBA: Club Patriotas de Punta Alta",
    fecha: "marzo 20, 2025",
    imagen: "/placeholder.svg?height=400&width=600",
    categorias: ["Noticias Destacadas", "Presencia Institucional", "Entidades Afiliadas"],
    extracto:
      "El tradicional club de la ciudad de Punta Alta se incorpora oficialmente a la Federación de Ajedrez del Sur de Buenos Aires.",
  },
  {
    id: "san-luis-nueva-entidad",
    titulo: "San Luis suma una nueva entidad al ajedrez federado argentino",
    fecha: "marzo 14, 2025",
    imagen: "/placeholder.svg?height=400&width=600",
    categorias: ["Entidades Afiliadas", "Noticias 2025", "Noticias Destacadas"],
    extracto:
      "La Federación Argentina de Ajedrez celebra la incorporación de un nuevo club en la provincia de San Luis, fortaleciendo el ajedrez en el interior del país.",
  },
  {
    id: "fasgba-afa-proyectos",
    titulo: "FASGBA y AFA consolidan su trabajo conjunto con nuevos proyectos para 2025",
    fecha: "marzo 14, 2025",
    imagen: "/placeholder.svg?height=400&width=600",
    categorias: ["Noticias 2025", "Noticias Destacadas", "Presencia Institucional"],
    extracto:
      "Las federaciones de ajedrez y fútbol firman un convenio para promover el ajedrez en los clubes deportivos de la región sur de Buenos Aires.",
  },
]

// Componente para mostrar una noticia destacada
function NoticiaDestacada({ noticia }: NoticiaProps): ReactNode {
  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <img src={noticia.imagen || "/placeholder.svg"} alt={noticia.titulo} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-6 text-white">
        <div className="mb-4 flex flex-wrap gap-2">
          {noticia.categorias.map((categoria) => (
            <Badge key={categoria} variant="outline" className="border-amber bg-black/50 text-white hover:bg-amber/20">
              {categoria}
            </Badge>
          ))}
        </div>
        <h2 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">{noticia.titulo}</h2>
        <div className="flex items-center gap-2 text-sm text-amber">
          <Calendar className="h-4 w-4" />
          <span>{noticia.fecha}</span>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar una noticia normal
function NoticiaCard({ noticia }: NoticiaProps): ReactNode {
  return (
    <div className="group relative h-full overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <img
          src={noticia.imagen || "/placeholder.svg"}
          alt={noticia.titulo}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-4 text-white">
        <div className="mb-2 flex flex-wrap gap-1">
          {noticia.categorias.slice(0, 2).map((categoria) => (
            <Badge
              key={categoria}
              variant="outline"
              className="border-amber bg-black/50 text-white hover:bg-amber/20 text-xs"
            >
              {categoria}
            </Badge>
          ))}
        </div>
        <h3 className="mb-2 text-lg font-bold leading-tight">{noticia.titulo}</h3>
        <div className="flex items-center gap-1 text-xs text-amber">
          <Calendar className="h-3 w-3" />
          <span>{noticia.fecha}</span>
        </div>
      </div>
    </div>
  )
}

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient<Database>({ 
    cookies: () => cookieStore
  })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Separar la noticia destacada de las demás
    const noticiaDestacada = noticias.find((noticia) => noticia.destacada)
    const noticiasSecundarias = noticias.filter((noticia) => !noticia.destacada)

    if (!noticiaDestacada) {
      throw new Error('No se encontró una noticia destacada')
    }

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          {/* Hero section con mensaje de bienvenida */}
          <section className="w-full py-12 md:py-24 lg:py-32 bg-[url('/placeholder.svg?height=800&width=1600')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-terracotta/80 to-amber/60"></div>
            <div className="container px-4 md:px-6 flex flex-col items-center space-y-4 text-center relative z-10">
              <div className="space-y-2 bg-background/90 p-6 rounded-lg backdrop-blur-sm border border-amber/20 shadow-lg">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-terracotta">
                  Federación de Ajedrez del Sur de Buenos Aires
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Promoviendo el ajedrez en la región sur de Buenos Aires desde 1985
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center pt-4">
                  <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white">
                    <Link href="/torneos">Próximos Torneos</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-amber text-amber-dark hover:bg-amber/10 hover:text-amber-dark"
                  >
                    <Link href="/clubes">Clubes Afiliados</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Sección de noticias */}
          <section className="w-full py-12 md:py-16 bg-gradient-to-b from-terracotta/5 to-amber/5">
            <div className="container px-4 md:px-6">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Últimas Noticias</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="border-amber text-amber-dark hover:bg-amber/10">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Anterior</span>
                  </Button>
                  <Button variant="outline" size="icon" className="border-amber text-amber-dark hover:bg-amber/10">
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Siguiente</span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {/* Noticia destacada */}
                <div className="lg:col-span-1 h-[400px] md:h-[500px] lg:h-full">
                  <Link href={`/noticias/${noticiaDestacada.id}`} className="block h-full">
                    <NoticiaDestacada noticia={noticiaDestacada} />
                  </Link>
                </div>

                {/* Grid de noticias secundarias */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {noticiasSecundarias.slice(0, 4).map((noticia) => (
                    <Link key={noticia.id} href={`/noticias/${noticia.id}`} className="block h-[250px]">
                      <NoticiaCard noticia={noticia} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/noticias">Ver todas las noticias</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Sección de próximos torneos */}
          <section className="w-full py-12 md:py-16 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Próximos Torneos</h2>
                <p className="mt-2 text-muted-foreground">Calendario de torneos organizados por FASGBA</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Tarjetas de torneos próximos */}
                <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-terracotta">Gran Prix FASGBA 2025</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span>15 de Abril, 2025 - 10:00hs</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-amber" />
                      <Link href="/clubes/club-de-ajedrez-bahia-blanca" className="text-amber-dark hover:underline">
                        Club de Ajedrez Bahía Blanca
                      </Link>
                    </div>
                    <p className="mt-3 text-sm">
                      Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.
                    </p>
                    <div className="mt-4">
                      <Button asChild size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                        <Link href="/torneos">Inscripción</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-terracotta">Torneo Rápido de Mayo</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span>25 de Mayo, 2025 - 14:00hs</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-amber" />
                      <Link href="/clubes/club-de-ajedrez-bahia-blanca" className="text-amber-dark hover:underline">
                        Club de Ajedrez Bahía Blanca
                      </Link>
                    </div>
                    <p className="mt-3 text-sm">Torneo rápido conmemorativo del 25 de Mayo con premios especiales.</p>
                    <div className="mt-4">
                      <Button asChild size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                        <Link href="/torneos">Inscripción</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-terracotta">Campeonato Regional Individual</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span>10 al 12 de Junio, 2025 - 10:00hs</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-amber" />
                      <Link href="/clubes/club-de-ajedrez-bahia-blanca" className="text-amber-dark hover:underline">
                        Club de Ajedrez Bahía Blanca
                      </Link>
                    </div>
                    <p className="mt-3 text-sm">Campeonato oficial de FASGBA válido para el ranking nacional y FIDE.</p>
                    <div className="mt-4">
                      <Button asChild size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                        <Link href="/torneos">Inscripción</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                  <Link href="/torneos">Ver todos los torneos</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Sección de clubes afiliados */}
          <section className="w-full py-12 md:py-16">
            <div className="container px-4 md:px-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Clubes Afiliados</h2>
                <p className="mt-2 text-muted-foreground">Conoce los clubes que forman parte de FASGBA</p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {/* Logos de clubes */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <Link
                    key={i}
                    href="/clubes"
                    className="flex h-24 items-center justify-center rounded-lg border border-amber/20 bg-background p-4 transition-colors hover:border-amber"
                  >
                    <img
                      src={`/placeholder.svg?height=80&width=80&text=Club ${i + 1}`}
                      alt={`Logo Club ${i + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/clubes">Ver todos los clubes</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  } catch (error) {
    console.error('Error in Home page:', error)
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          {/* ... rest of the JSX ... */}
        </main>
        <SiteFooter />
      </div>
    )
  }
}

