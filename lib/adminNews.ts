import { createClient } from '@supabase/supabase-js'

// Service-role client for admin news listing. Server-only — never import from a
// "use client" module.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AdminNewsItem {
  id: number
  title: string
  date: string
  image: string | null
  extract: string
  text: string
  tags: string[]
  club_id: number | null
  club: { id: number; name: string } | null
  created_by_auth_id: string | null
  author_email?: string
  author_name?: string
  created_at: string
  updated_at: string
}

export interface AdminNewsQuery {
  page?: number
  limit?: number
  search?: string
  club?: string // 'all' | 'fasgba' | '<club id>'
  date?: string // YYYY-MM-DD, matches news on/after this date
  sortBy?: 'date' | 'title'
  order?: 'asc' | 'desc'
}

export interface AdminNewsPage {
  news: AdminNewsItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function authorName(user: { user_metadata?: Record<string, unknown> | null }): string | undefined {
  const nombre = (user.user_metadata?.nombre as string) || ''
  const apellido = (user.user_metadata?.apellido as string) || ''
  return nombre && apellido ? `${nombre} ${apellido}` : nombre || apellido || undefined
}

// Author search needs auth metadata, which isn't queryable in the DB, so we page
// through the auth users and collect ids whose name/email matches the term.
async function findAuthorIdsMatching(term: string): Promise<string[]> {
  const lc = term.toLowerCase()
  const ids: string[] = []
  for (let page = 1; ; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users || []
    for (const u of users) {
      const name = authorName(u) || ''
      if (name.toLowerCase().includes(lc) || (u.email || '').toLowerCase().includes(lc)) {
        ids.push(u.id)
      }
    }
    if (users.length < 1000) break
  }
  return ids
}

// One page of admin news: server-side search (title/extract + matching club
// name + matching author), club/date filters and ordering, with author info
// enriched only for the returned rows (deduped) so the cost scales with the
// page size, not the whole catalog.
export async function fetchAdminNewsPage(q: AdminNewsQuery = {}): Promise<AdminNewsPage> {
  const page = Math.max(1, q.page || 1)
  const limit = Math.min(50, Math.max(1, q.limit || 20))
  const offset = (page - 1) * limit
  const search = (q.search || '').trim()
  const club = q.club || 'all'
  const date = q.date || ''
  const sortBy = q.sortBy === 'title' ? 'title' : 'date'
  const ascending = q.order === 'asc'

  let clubIds: number[] = []
  let authorIds: string[] = []
  if (search) {
    const [clubsResult, matchedAuthorIds] = await Promise.all([
      supabase.from('clubs').select('id').ilike('name', `%${search}%`),
      findAuthorIdsMatching(search),
    ])
    clubIds = (clubsResult.data || []).map((c) => c.id)
    authorIds = matchedAuthorIds
  }

  let query = supabase
    .from('news')
    .select(
      `id, title, date, image, extract, text, tags, club_id, created_by_auth_id, created_at, updated_at, club:clubs(id, name)`,
      { count: 'exact' }
    )

  if (search) {
    const ors = [`title.ilike.%${search}%`, `extract.ilike.%${search}%`]
    if (clubIds.length) ors.push(`club_id.in.(${clubIds.join(',')})`)
    if (authorIds.length) ors.push(`created_by_auth_id.in.(${authorIds.join(',')})`)
    query = query.or(ors.join(','))
  }

  if (club === 'fasgba') query = query.is('club_id', null)
  else if (club !== 'all') query = query.eq('club_id', parseInt(club, 10))

  if (date) query = query.gte('date', date)

  const { data, error, count } = await query
    .order(sortBy, { ascending })
    .order('id', { ascending })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching admin news:', error)
    throw new Error('Error al obtener las noticias')
  }

  const rows = (data || []) as unknown as Array<
    Omit<AdminNewsItem, 'club' | 'author_email' | 'author_name'> & { club: { id: number; name: string } | null }
  >

  // Enrich authors for this page only, deduped and in parallel.
  const uniqueAuthorIds = [...new Set(rows.map((r) => r.created_by_auth_id).filter((id): id is string => !!id))]
  const authorMap = new Map<string, { email?: string; name?: string }>()
  await Promise.all(
    uniqueAuthorIds.map(async (id) => {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id)
        if (!userError && userData.user) {
          authorMap.set(id, { email: userData.user.email || undefined, name: authorName(userData.user) })
        }
      } catch (err) {
        console.warn(`Failed to fetch author ${id}:`, err)
      }
    })
  )

  const news: AdminNewsItem[] = rows.map((r) => {
    const author = r.created_by_auth_id ? authorMap.get(r.created_by_auth_id) : undefined
    return {
      ...r,
      tags: r.tags || [],
      club: r.club ? { id: r.club.id, name: r.club.name } : null,
      author_email: author?.email,
      author_name: author?.name,
    }
  })

  return { news, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) }
}
