import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ALLOWED_COUNTRY = 'AR'

// Paths that should skip session middleware for better caching
const CACHEABLE_PATHS = ['/noticias', '/clubes', '/ranking', '/torneos']

// Public API routes that can be cached at CDN level
const CACHEABLE_API_PATHS = ['/api/clubs', '/api/news', '/api/tournaments', '/api/ranking']

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
    <p>Este sitio está disponible únicamente para usuarios en Argentina.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function proxy(request: NextRequest) {
  // Geo-blocking: Vercel sets x-vercel-ip-country on all requests (free tier).
  // Header is absent in local dev — allow those requests through.
  const country = request.headers.get('x-vercel-ip-country')
  if (country && country !== ALLOWED_COUNTRY) {
    return createBlockedResponse()
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
