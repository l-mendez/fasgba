import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { ReactNode } from "react"
import { createClient } from '@supabase/supabase-js'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllNews } from "@/lib/newsUtils"
import { getUpcomingTournaments } from "@/lib/tournamentUtils"
import { getAllClubs } from "@/lib/clubUtils"
import { getImageUrl } from "@/lib/imageUtils"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

// Create Supabase client for server-side operations (tournaments only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types for the data structures
interface NewsItem {
  id: number
  title: string
  date: string
  image: string | null
  extract: string
  tags: string[]
  club_id: number | null
  club: {
    id: number
    name: string
  } | null
}

interface Tournament {
  id: number
  title: string
  description: string | null
  time: string | null
  place: string | null
  location: string | null
  rounds: number | null
  pace: string | null
  inscription_details: string | null
  cost: string | null
  prizes: string | null
  image: string | null
  created_by_club_id?: number | null
  formatted_start_date?: string
}

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  image: string | null
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

// Server-side data fetching functions
async function fetchNews(): Promise<NewsItem[]> {
  try {
    const { data } = await getAllNews({ 
      limit: 20, // Increased limit to ensure we get enough FASGBA news after sorting
      include: ['club', 'author']
    })
    
    const mappedNews = data.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      image: item.image,
      extract: item.extract || '',
      tags: item.tags || [],
      club_id: item.club_id,
      club: item.club ? {
        id: item.club.id,
        name: item.club.name
      } : null
    }))

    // Sort news: FASGBA news (club_id = null) first, then club news
    // Within each group, sort by date (newest first)
    const sortedNews = mappedNews.sort((a, b) => {
      // First, prioritize FASGBA news (club_id = null)
      if (a.club_id === null && b.club_id !== null) return -1
      if (a.club_id !== null && b.club_id === null) return 1
      
      // If both are FASGBA news or both are club news, sort by date (newest first)
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    // Return only the first 5 for homepage display
    return sortedNews.slice(0, 5)
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const tournaments = await getUpcomingTournaments(supabase, 3)
    
    // Add formatted dates for display - tournaments don't have direct start_date
    return tournaments.map(tournament => ({
      ...tournament,
      formatted_start_date: 'Fecha por confirmar' // We'll update this based on tournament dates logic
    }))
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return []
  }
}

async function fetchClubs(): Promise<Club[]> {
  try {
    const clubs = await getAllClubs()
    // Limit the results to 6 after fetching
    return (clubs as Club[]).slice(0, 6)
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
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
    imagen: getImageUrl(newsItem.image),
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
  // Fetch all data in parallel on the server
  const [news, tournaments, clubs] = await Promise.all([
    fetchNews(),
    fetchTournaments(),
    fetchClubs()
  ])

  // Process news data
  const noticias = news.map((item, index) => 
    mapNewsToNoticia(item, index === 0) // First news item is featured
  )
  
  const noticiaDestacada = noticias.find(noticia => noticia.destacada)
  const noticiasSecundarias = noticias.filter(noticia => !noticia.destacada)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/" />
      <main className="flex-1">
        {/* Hero section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-[url('/placeholder.svg?height=800&width=1600')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-terracotta/80 to-amber/60"></div>
          <div className="container px-4 md:px-6 flex flex-col items-center space-y-4 text-center relative z-10">
            <div className="space-y-2 bg-background/90 p-6 rounded-lg backdrop-blur-sm border border-amber/20 shadow-lg">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-terracotta">
                Federación de Ajedrez del Sur del Gran Buenos Aires
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Promoviendo el ajedrez en la región sur de Buenos Aires desde 1975
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
}

