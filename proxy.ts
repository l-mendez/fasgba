import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Countries are managed from /admin/paises (public.country_access). This list
// is only used until the first successful fetch, or if Supabase is unreachable.
const FALLBACK_ALLOWED_COUNTRIES = new Set(['AR', 'BR', 'CO'])
const ALLOWLIST_TTL_MS = 60_000

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Paths that should skip session middleware for better caching
const CACHEABLE_PATHS = ['/noticias', '/clubes', '/ranking', '/torneos', '/documentos']

// Public API routes that can be cached at CDN level
const CACHEABLE_API_PATHS = ['/api/clubs', '/api/news', '/api/tournaments', '/api/ranking']

let cachedAllowedCountries: Set<string> | null = null
let allowlistFetchedAt = 0

function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  }
}

/**
 * Enabled country codes, cached per edge instance for 60s. On failure the last
 * known list is kept (or the fallback), so the site never becomes unreachable.
 */
async function getAllowedCountries(): Promise<Set<string>> {
  const isFresh = cachedAllowedCountries && Date.now() - allowlistFetchedAt < ALLOWLIST_TTL_MS
  if (isFresh) return cachedAllowedCountries as Set<string>

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return cachedAllowedCountries ?? FALLBACK_ALLOWED_COUNTRIES
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/country_access?select=country_code&enabled=eq.true`,
      { headers: supabaseHeaders(), cache: 'no-store' }
    )

    if (!response.ok) throw new Error(`country_access fetch failed: ${response.status}`)

    const rows: Array<{ country_code: string }> = await response.json()
    const codes = new Set(rows.map((row) => row.country_code))
    codes.add('AR') // Argentina is always allowed.
    cachedAllowedCountries = codes
  } catch {
    cachedAllowedCountries = cachedAllowedCountries ?? FALLBACK_ALLOWED_COUNTRIES
  }

  // Stamped on failure too so a broken fetch isn't retried on every request.
  allowlistFetchedAt = Date.now()
  return cachedAllowedCountries
}

/** Fire-and-forget per-country daily counters. */
function recordTraffic(country: string, blocked: boolean, event?: NextFetchEvent): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

  const pending = fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_country_traffic`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_country: country, p_blocked: blocked }),
  }).catch(() => {})

  event?.waitUntil?.(pending)
}

function createBlockedResponse(): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso restringido - FASGBA</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; max-width: 480px; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #daa056; }
    p { color: #a1a1aa; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Acceso restringido</h1>
    <p>Este sitio no está disponible en tu región.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function proxy(request: NextRequest, event?: NextFetchEvent) {
  // Geo-blocking: Vercel sets x-vercel-ip-country on all requests (free tier).
  // Header is absent in local dev — allow those requests through.
  const country = request.headers.get('x-vercel-ip-country')

  if (country) {
    const allowedCountries = await getAllowedCountries()

    if (!allowedCountries.has(country)) {
      recordTraffic(country, true, event)
      return createBlockedResponse()
    }

    // Only page views are counted, to keep the volume of RPC calls sane.
    if (request.headers.get('sec-fetch-dest') === 'document') {
      recordTraffic(country, false, event)
    }
  }

  const { pathname } = request.nextUrl

  // Skip session middleware for cacheable public pages (allows CDN caching)
  // Only skip for exact path or path without query params for filtering
  const isCacheablePath = CACHEABLE_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )

  // Check if this is a cacheable API route (GET requests only)
  const isCacheableApiPath = request.method === 'GET' && CACHEABLE_API_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )

  // For cacheable paths, only update session if there's an auth cookie
  // This allows anonymous users to get cached responses
  const hasAuthCookie = request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token') ||
    Array.from(request.cookies.getAll()).some(c => c.name.includes('supabase'))

  if ((isCacheablePath || isCacheableApiPath) && !hasAuthCookie) {
    const response = NextResponse.next()

    // Add cache headers for public API responses (5 min cache, 1 hour stale-while-revalidate)
    if (isCacheableApiPath) {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    }

    return response
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (crawler rules)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
