// Pure, client-safe news presentation helpers (no server/supabase imports).

/** Label shown as the source when a news item has no owning club. */
export const FEDERATION_NAME = 'FASGBA'

/** Builds the canonical /noticias URL, omitting params left at their default. */
export function buildNoticiasUrl(
  { tag = 'all', club = 'all', page = 1 }: { tag?: string; club?: string; page?: number } = {}
): string {
  const params = new URLSearchParams()
  if (tag !== 'all') params.set('tag', tag)
  if (club !== 'all') params.set('club', club)
  if (page > 1) params.set('page', page.toString())
  const query = params.toString()
  return query ? `/noticias?${query}` : '/noticias'
}
