import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"
import { ReactNode } from "react"
import type { Metadata } from 'next'
import { getNews, getTournaments, getClubs, type NewsItem, type Tournament, type Club } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  description: 'Federación de Ajedrez del Sur de Buenos Aires - Promoviendo el ajedrez en la región sur de Buenos Aires desde 1985',
}

// Interface for processed news items (mapping API data to component props)
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

// Helper function to convert API news to component format
function mapNewsToNoticia(newsItem: NewsItem, isFeatured = false): Noticia {
  const date = new Date(newsItem.date)
  const formattedDate = date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return {
    id: newsItem.id.toString(),
    titulo: newsItem.title,
    fecha: formattedDate,
    imagen: newsItem.image || "/placeholder.svg?height=600&width=800",
    categorias: newsItem.tags,
    extracto: newsItem.extract || newsItem.title,
    destacada: isFeatured
  }
}

// Helper function to format tournament date
function formatTournamentDate(tournament: Tournament): string {
  if (tournament.formatted_start_date) {
    return tournament.formatted_start_date
  }
  
  if (tournament.start_date) {
    const date = new Date(tournament.start_date)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return 'Fecha por confirmar'
}

// Component for featured news
function NoticiaDestacada({ noticia }: NoticiaProps): ReactNode {
  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <img src={noticia.imagen || "/placeholder.svg"} alt={noticia.titulo} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-6 text-white">
        <div className="mb-4 flex flex-wrap gap-2">
          {noticia.categorias.slice(0, 3).map((categoria) => (
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

// Component for regular news cards
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

// Component for tournament cards
function TournamentCard({ tournament }: { tournament: Tournament }): ReactNode {
  const clubName = tournament.place || 'Sede por confirmar'
  
  return (
    <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
      <div className="p-6">
        <h3 className="text-xl font-bold text-terracotta line-clamp-2">{tournament.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-amber flex-shrink-0" />
          <span className="line-clamp-1">
            {formatTournamentDate(tournament)}
            {tournament.time && ` - ${tournament.time}`}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-amber flex-shrink-0" />
          <span className="text-amber-dark line-clamp-1">{clubName}</span>
        </div>
        {tournament.description && (
          <p className="mt-3 text-sm line-clamp-3">{tournament.description}</p>
        )}
        <div className="mt-4">
          <Button asChild size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
            <Link href={`/torneos/${tournament.id}`}>Ver detalles</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Component for club logos
function ClubCard({ club }: { club: Club }): ReactNode {
  return (
    <Link
      href={`/clubes/${club.id}`}
      className="flex h-24 items-center justify-center rounded-lg border border-amber/20 bg-background p-4 transition-colors hover:border-amber group"
      title={club.name}
    >
      <div className="text-center">
        <div className="text-xs font-medium text-muted-foreground group-hover:text-amber-dark line-clamp-2">
          {club.name}
        </div>
      </div>
    </Link>
  )
}

export default async function Home() {
  const supabase = await createClient()

  try {
    // Fetch data from APIs in parallel
    const [newsResponse, tournaments, clubs] = await Promise.all([
      getNews({ 
        limit: 5, 
        orderBy: 'date', 
        order: 'desc',
        include: 'author,club'
      }).catch(err => {
        console.error('Failed to fetch news:', err)
        return { news: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } }
      }),
      getTournaments({ 
        limit: 3, 
        status: 'upcoming',
        format: 'display',
        orderBy: 'start_date',
        order: 'asc'
      }).catch(err => {
        console.error('Failed to fetch tournaments:', err)
        return []
      }),
      getClubs({ 
        hasContact: true
      }).catch(err => {
        console.error('Failed to fetch clubs:', err)
        return []
      })
    ])

    // Process news data
    const noticias = newsResponse.news.map((item, index) => 
      mapNewsToNoticia(item, index === 0) // First news item is featured
    )
    
    const noticiaDestacada = noticias.find(noticia => noticia.destacada)
    const noticiasSecundarias = noticias.filter(noticia => !noticia.destacada)

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          {/* Hero section */}
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

          {/* News section */}
          <section className="w-full py-12 md:py-16 bg-gradient-to-b from-terracotta/5 to-amber/5">
            <div className="container px-4 md:px-6">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Últimas Noticias</h2>
              </div>

              {noticias.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                  {/* Featured news */}
                  {noticiaDestacada && (
                    <div className="lg:col-span-1 h-[400px] md:h-[500px] lg:h-full">
                      <Link href={`/noticias/${noticiaDestacada.id}`} className="block h-full">
                        <NoticiaDestacada noticia={noticiaDestacada} />
                      </Link>
                    </div>
                  )}

                  {/* Secondary news grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {noticiasSecundarias.slice(0, 4).map((noticia) => (
                      <Link key={noticia.id} href={`/noticias/${noticia.id}`} className="block h-[250px]">
                        <NoticiaCard noticia={noticia} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
                </div>
              )}

              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/noticias">Ver todas las noticias</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Tournaments section */}
          <section className="w-full py-12 md:py-16 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Próximos Torneos</h2>
                <p className="mt-2 text-muted-foreground">Calendario de torneos organizados por FASGBA</p>
              </div>

              {tournaments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay torneos próximos programados.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Mantente atento a nuestras redes sociales para futuras actualizaciones.
                  </p>
                </div>
              )}

              <div className="mt-8 text-center">
                <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
                  <Link href="/torneos">Ver todos los torneos</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Clubs section */}
          <section className="w-full py-12 md:py-16">
            <div className="container px-4 md:px-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Clubes Afiliados</h2>
                <p className="mt-2 text-muted-foreground">Conoce los clubes que forman parte de FASGBA</p>
              </div>

              {clubs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {clubs.slice(0, 6).map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay clubes afiliados disponibles.</p>
                </div>
              )}

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
    
    // Fallback UI in case of error
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
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
                <div className="text-center mt-4">
                  <p className="text-sm text-red-600">
                    Hubo un problema cargando el contenido. Por favor, intenta más tarde.
                  </p>
                </div>
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
        </main>
        <SiteFooter />
      </div>
    )
  }
}

