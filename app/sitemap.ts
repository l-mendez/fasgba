import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'

import { getAdminClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/seo'
import { PARTIDOS } from '@/lib/partidos'

// Rendered per request: Vercel serves a prerendered sitemap.xml as a static
// file that revalidatePath('/sitemap.xml') never purges, so new news/torneos
// never reached it. The queries are cached indefinitely under the tags the
// lib/cache invalidators already purge (news, clubs, torneos, profesores,
// partidas), so a request only reads the DB after a mutation. Never time-based.
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]

const STATIC_PAGES: { path: string; priority: number; changeFrequency: Entry['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/torneos', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/ranking', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/noticias', priority: 0.8, changeFrequency: 'daily' },
  { path: '/clubes', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/ajedrez', priority: 0.8, changeFrequency: 'monthly' },
  ...PARTIDOS.map(({ slug }) => ({ path: `/ajedrez/${slug}`, priority: 0.8, changeFrequency: 'weekly' as const })),
  { path: '/profesores', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/arbitraje', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/politica-privacidad', priority: 0.1, changeFrequency: 'yearly' },
  { path: '/terminos-condiciones', priority: 0.1, changeFrequency: 'yearly' },
]

const toDate = (value: string | null) => (value ? new Date(value) : undefined)

// PostgREST embeds many-to-one relations as objects, but the inferred type is an array.
const one = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value)

const PAGE_SIZE = 1000 // PostgREST caps each response at 1000 rows.

// Every page of a query, so the sitemap never silently stops at the row cap.
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`sitemap query failed: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

// Games with a PGN have their own page (board, moves, PGN download); games
// without one are a bare result and stay out of the sitemap.
const getSitemapGames = unstable_cache(
  async () => {
    const supabase = getAdminClient()
    const [individual, team] = await Promise.all([
      fetchAll((from, to) =>
        supabase
          .from('individual_games')
          .select('id, round:rounds(tournament_id)')
          .not('pgn', 'is', null)
          .neq('pgn', '')
          .order('id')
          .range(from, to)
      ),
      fetchAll((from, to) =>
        supabase
          .from('match_games')
          .select('id, match:matches(round:rounds(tournament_id))')
          .not('pgn', 'is', null)
          .neq('pgn', '')
          .order('id')
          .range(from, to)
      ),
    ])
    const games: { id: number; tournamentId: number }[] = []
    for (const game of individual) {
      const tournamentId = one(game.round)?.tournament_id
      if (tournamentId) games.push({ id: game.id, tournamentId })
    }
    for (const game of team) {
      const tournamentId = one(one(game.match)?.round)?.tournament_id
      if (tournamentId) games.push({ id: game.id, tournamentId })
    }
    return games
  },
  ['sitemap-games'],
  { revalidate: false, tags: ['partidas', 'torneos'] }
)

// Throws on a failed query so the error is never cached.
const getSitemapData = unstable_cache(
  async () => {
    const supabase = getAdminClient()
    const [news, clubs, tournaments, profesores] = await Promise.all([
      supabase.from('news').select('id, date, updated_at').order('id', { ascending: false }),
      supabase.from('clubs').select('id, teams(count)').eq('affiliated', true),
      supabase.from('tournaments').select('id').order('id', { ascending: false }),
      supabase.from('profesores').select('id, updated_at'),
    ])
    const failed = [news, clubs, tournaments, profesores].find((result) => result.error)
    if (failed?.error) throw new Error(`sitemap query failed: ${failed.error.message}`)
    return { news: news.data ?? [], clubs: clubs.data ?? [], tournaments: tournaments.data ?? [], profesores: profesores.data ?? [] }
  },
  ['sitemap-data'],
  { revalidate: false, tags: ['news', 'clubs', 'torneos', 'profesores'] }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ news, clubs, tournaments, profesores }, games] = await Promise.all([getSitemapData(), getSitemapGames()])

  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    priority,
    changeFrequency,
  }))

  for (const item of news) {
    pages.push({ url: absoluteUrl(`/noticias/${item.id}`), lastModified: toDate(item.updated_at ?? item.date), priority: 0.7 })
  }
  for (const item of tournaments) {
    pages.push({ url: absoluteUrl(`/torneos/${item.id}`), priority: 0.7 })
  }
  for (const item of clubs) {
    pages.push({ url: absoluteUrl(`/clubes/${item.id}`), priority: 0.6 })
    // The team page is noindex while the club has no teams.
    if ((one(item.teams)?.count ?? 0) > 0) {
      pages.push({ url: absoluteUrl(`/clubes/${item.id}/equipos`), priority: 0.4 })
    }
  }
  for (const item of profesores) {
    pages.push({ url: absoluteUrl(`/profesores/${item.id}`), lastModified: toDate(item.updated_at), priority: 0.4 })
  }
  for (const game of games) {
    pages.push({ url: absoluteUrl(`/torneos/${game.tournamentId}/partidas/${game.id}`), priority: 0.3 })
  }

  return pages
}
