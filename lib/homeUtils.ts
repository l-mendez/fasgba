import type { Club } from "@/lib/clubUtils"
import { getAllClubs } from "@/lib/clubUtils"
import { getImageUrl } from "@/lib/imageUtils"
import type { NewsDisplay } from "@/lib/newsUtils"
import { getAllNews } from "@/lib/newsUtils"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TournamentDisplay } from "@/lib/tournamentUtils"
import { getAllTournamentsWithDates, transformTournamentToDisplay } from "@/lib/tournamentUtils"

export interface HomeNews {
  id: string
  titulo: string
  fecha: string
  imagen: string
  categorias: string[]
  extracto: string
  destacada?: boolean
}

export type HomeTournament = TournamentDisplay
export type HomeClub = Pick<Club, "id" | "name">

export interface HomePageData {
  news: HomeNews[]
  tournaments: HomeTournament[]
  clubs: HomeClub[]
}

export async function getHomePageData(): Promise<HomePageData> {
  const [news, tournaments, clubs] = await Promise.all([
    fetchHomeNews(),
    fetchHomeTournaments(),
    fetchHomeClubs(),
  ])

  return { news, tournaments, clubs }
}

async function fetchHomeNews(): Promise<HomeNews[]> {
  try {
    const { data } = await getAllNews({ limit: 20, include: ["club"] })
    const sortedNews = data
      .map(normalizeNewsItem)
      .sort(sortHomeNews)
      .slice(0, 7)

    return sortedNews.map((item, index) => mapNewsToHomeNews(item, index === 0))
  } catch (error) {
    console.error("Error fetching news:", error)
    return []
  }
}

async function fetchHomeTournaments(): Promise<HomeTournament[]> {
  try {
    const supabase = createAdminClient()
    const tournaments = await getAllTournamentsWithDates(supabase)
    const displayTournaments = tournaments.map(transformTournamentToDisplay)

    const ongoing = displayTournaments.filter(tournament => tournament.is_ongoing)
    const upcoming = displayTournaments.filter(tournament => tournament.is_upcoming)

    return [...ongoing, ...upcoming].slice(0, 6)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return []
  }
}

async function fetchHomeClubs(): Promise<HomeClub[]> {
  try {
    const clubs = await getAllClubs()
    return clubs.slice(0, 12).map(({ id, name }) => ({ id, name }))
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return []
  }
}

function normalizeNewsItem(item: NewsDisplay) {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    image: item.image,
    extract: item.extract || "",
    tags: item.tags || [],
    clubId: item.club_id,
  }
}

function sortHomeNews(
  a: ReturnType<typeof normalizeNewsItem>,
  b: ReturnType<typeof normalizeNewsItem>
) {
  if (a.clubId === null && b.clubId !== null) return -1
  if (a.clubId !== null && b.clubId === null) return 1

  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

function mapNewsToHomeNews(
  item: ReturnType<typeof normalizeNewsItem>,
  featured = false
): HomeNews {
  return {
    id: item.id.toString(),
    titulo: item.title,
    fecha: formatHomeNewsDate(item.date),
    imagen: getImageUrl(item.image),
    categorias: item.tags,
    extracto: item.extract || item.title,
    destacada: featured,
  }
}

function formatHomeNewsDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
