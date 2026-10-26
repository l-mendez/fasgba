import Link from "next/link"
import Image from "next/image"
import { Calendar, ImageIcon, MapPin } from "lucide-react"
import { ReactNode } from "react"
import { unstable_cache } from "next/cache"
import { createClient } from '@supabase/supabase-js'

import { Badge } from "@/components/ui/badge"
import { getAllNews } from "@/lib/newsUtils"
import { getAllTournamentsForDisplay } from "@/lib/tournamentUtils"
import { getAllClubs } from "@/lib/clubUtils"
import { getImageUrl, getImageUrlNullable } from "@/lib/imageUtils"
import { formatArgentinaDateOnly, getDateInputValue } from "@/lib/dateUtils"
import { getCachedLatestRankingData } from "@/lib/rankingStorage"
import { normalizePlayer, selectPlayersPage, sortPlayersByRatingType } from "@/lib/rankingDisplay"
import type { Player } from "@/lib/rankingUtils"
import { safe } from "@/lib/utils/safe"
import { SectionHeader } from "@/components/home/section-header"
import { TopRanking } from "@/components/home/top-ranking"

// Cached indefinitely: each fetch is wrapped in unstable_cache with a tag
// matching the rest of the app's invalidations, and lib/cache/{news,torneos,
// clubs}.ts purge this route on mutation. Time-based revalidation would rewrite
// the ISR entry on a timer forever, which is what blew the hosting quota.
export const revalidate = false

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

// Server-side data fetching functions. Each is wrapped in unstable_cache and
// returns a plain, JSON-serializable shape (no Date objects cross the boundary).
// Errors are caught OUTSIDE the cache so transient failures degrade gracefully
// without being cached.
const getCachedNews = unstable_cache(
  async (): Promise<NewsItem[]> => {
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
      return getDateInputValue(b.date).localeCompare(getDateInputValue(a.date))
    })

    // Return only the first 5 for homepage display
    return sortedNews.slice(0, 5)
  },
  ['home-news'],
  { revalidate: false, tags: ['news'] }
)

async function fetchNews(): Promise<NewsItem[]> {
  try {
    return await getCachedNews()
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

// Filtering/sorting use Date objects (start_date/getTime), so they run INSIDE
// the cache; only the already-mapped, Date-free Tournament[] is cached.
const getCachedTournaments = unstable_cache(
  async (): Promise<Tournament[]> => {
    const allTournaments = await getAllTournamentsForDisplay(supabase)
    const upcoming = allTournaments.filter(t => t.is_upcoming)

    // Sort FASGBA tournaments (no created_by_club_id) first, then by start date ascending.
    // With nothing upcoming, fall back to the most recent ongoing/past ones.
    const sorted = upcoming.length > 0
      ? upcoming.sort((a, b) => {
          const aIsFasgba = !a.created_by_club_id
          const bIsFasgba = !b.created_by_club_id
          if (aIsFasgba && !bIsFasgba) return -1
          if (!aIsFasgba && bIsFasgba) return 1
          return a.start_date.getTime() - b.start_date.getTime()
        })
      : allTournaments.sort((a, b) => b.start_date.getTime() - a.start_date.getTime())

    return sorted.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      time: t.time,
      place: t.place,
      location: t.location,
      rounds: t.rounds,
      pace: t.pace,
      inscription_details: t.inscription_details,
      cost: t.cost,
      prizes: t.prizes,
      image: t.image,
      created_by_club_id: t.created_by_club_id,
      formatted_start_date: t.formatted_start_date,
    }))
  },
  ['home-tournaments'],
  { revalidate: false, tags: ['torneos'] }
)

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    return await getCachedTournaments()
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return []
  }
}

const getCachedClubs = unstable_cache(
  async (): Promise<Club[]> => {
    const clubs = await getAllClubs()
    // Limit the results to 6 after fetching
    return (clubs as Club[]).slice(0, 6)
  },
  ['home-clubs'],
  { revalidate: false, tags: ['clubs'] }
)

async function fetchClubs(): Promise<Club[]> {
  try {
    return await getCachedClubs()
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
}

// Top 10 active players by standard rating, ranked as on /ranking
async function fetchTopPlayers(): Promise<Player[]> {
  const latest = await safe(getCachedLatestRankingData, { players: [] }, "Error fetching ranking:")
  const players = ((latest.players as unknown[]) || []).map(normalizePlayer)
  return selectPlayersPage(sortPlayersByRatingType(players, 'standard'), { activeFilter: 'active', pageSize: 10 }).players
}

// Helper function to convert API news to component format
function mapNewsToNoticia(newsItem: NewsItem, isFeatured = false): Noticia {
  return {
    id: newsItem.id.toString(),
    titulo: newsItem.title,
    fecha: formatArgentinaDateOnly(newsItem.date),
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
        <Image
          src={noticia.imagen || "/placeholder.svg"}
          alt={noticia.titulo}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          unoptimized
          className="object-cover"
          priority
        />
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
        <Image
          src={noticia.imagen || "/placeholder.svg"}
          alt={noticia.titulo}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
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

// Component for tournament cards (same look as the /torneos cards)
function TournamentCard({ tournament }: { tournament: Tournament }): ReactNode {
  return (
    <Link
      href={`/torneos/${tournament.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-amber"
    >
      <h3 className="text-lg font-semibold leading-tight text-terracotta line-clamp-2 group-hover:underline">{tournament.title}</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {formatTournamentDate(tournament)}
            {tournament.time && ` · ${tournament.time}`}
          </span>
        </li>
        {tournament.place && (
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{tournament.place}</span>
          </li>
        )}
      </ul>
      {tournament.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">{tournament.description}</p>
      )}
    </Link>
  )
}

// Component for club image cards
function ClubCard({ club }: { club: Club }): ReactNode {
  const imageUrl = getImageUrlNullable(club.image)

  return (
    <Link
      href={`/clubes/${club.id}`}
      className="group block overflow-hidden rounded-lg border border-amber/20 bg-background transition-colors hover:border-amber"
      title={club.name}
    >
      <div className="relative aspect-square w-full bg-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Imagen de ${club.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            unoptimized
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="truncate p-2 text-center text-xs font-medium text-muted-foreground group-hover:text-amber-dark">
        {club.name}
      </p>
    </Link>
  )
}

export default async function Home() {
  // Fetch all data in parallel on the server
  const [news, tournaments, clubs, topPlayers] = await Promise.all([
    fetchNews(),
    fetchTournaments(),
    fetchClubs(),
    fetchTopPlayers()
  ])

  // Process news data
  const noticias = news.map((item, index) => 
    mapNewsToNoticia(item, index === 0) // First news item is featured
  )
  
  const noticiaDestacada = noticias.find(noticia => noticia.destacada)
  const noticiasSecundarias = noticias.filter(noticia => !noticia.destacada)

  return (
    <>
      <h1 className="sr-only">Federación de Ajedrez del Sur del Gran Buenos Aires</h1>

      {/* News section */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-b from-terracotta/5 to-amber/5">
        <div className="container px-4 md:px-6">
          <SectionHeader title="Noticias" href="/noticias" />

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
        </div>
      </section>

      {/* Tournaments section */}
      <section className="w-full py-12 md:py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <SectionHeader title="Torneos" href="/torneos" />

          {tournaments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay torneos disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ranking section */}
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <SectionHeader title="Ranking" href="/ranking" />
          <TopRanking players={topPlayers} />
        </div>
      </section>

      {/* Clubs section */}
      <section className="w-full py-12 md:py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <SectionHeader title="Clubes" href="/clubes" />

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
        </div>
      </section>
    </>
  )
}
