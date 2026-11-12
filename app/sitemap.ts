import type { MetadataRoute } from 'next'

import { getAdminClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/seo'
import { PARTIDOS } from '@/lib/partidos'

// Prerendered once and purged on demand by the lib/cache invalidators (news,
// clubs, torneos, profesores all revalidate '/sitemap.xml'). Never time-based.
export const revalidate = false

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminClient()
  const [news, clubs, tournaments, profesores] = await Promise.all([
    supabase.from('news').select('id, date, updated_at').order('id', { ascending: false }),
    supabase.from('clubs').select('id').eq('affiliated', true),
    supabase.from('tournaments').select('id').order('id', { ascending: false }),
    supabase.from('profesores').select('id, updated_at'),
  ])
  // Fail the regeneration instead of caching a sitemap with missing sections;
  // Next keeps serving the previous one.
  const failed = [news, clubs, tournaments, profesores].find((result) => result.error)
  if (failed?.error) throw new Error(`sitemap query failed: ${failed.error.message}`)

  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    priority,
    changeFrequency,
  }))

  for (const item of news.data ?? []) {
    pages.push({ url: absoluteUrl(`/noticias/${item.id}`), lastModified: toDate(item.updated_at ?? item.date), priority: 0.7 })
  }
  for (const item of tournaments.data ?? []) {
    pages.push({ url: absoluteUrl(`/torneos/${item.id}`), priority: 0.7 })
  }
  for (const item of clubs.data ?? []) {
    pages.push({ url: absoluteUrl(`/clubes/${item.id}`), priority: 0.6 })
  }
  for (const item of profesores.data ?? []) {
    pages.push({ url: absoluteUrl(`/profesores/${item.id}`), lastModified: toDate(item.updated_at), priority: 0.4 })
  }

  return pages
}
