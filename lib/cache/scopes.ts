// Single source of truth for the manual cache-purge scopes, shared by the
// admin menu and /api/admin/cache/revalidate. Deliberately free of `next/cache`
// imports so the client component can import it without pulling in server code.
// Adding a scope here is a type error until both sides handle it.
export const CACHE_SCOPES = [
  'news',
  'clubs',
  'torneos',
  'ranking',
  'profesores',
  'arbitros',
  'documentos',
] as const

export type CacheScope = (typeof CACHE_SCOPES)[number]
