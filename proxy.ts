import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Paths that should skip session middleware for better caching
const CACHEABLE_PATHS = ['/noticias', '/clubes', '/ranking', '/torneos']

// Public API routes that can be cached at CDN level
const CACHEABLE_API_PATHS = ['/api/clubs', '/api/news', '/api/tournaments', '/api/ranking']

export async function proxy(request: NextRequest) {
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
