import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Paths that should skip session middleware for better caching
const CACHEABLE_PATHS = ['/noticias', '/clubes', '/ranking', '/torneos']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip session middleware for cacheable public pages (allows CDN caching)
  // Only skip for exact path or path without query params for filtering
  const isCacheablePath = CACHEABLE_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )

  // For cacheable paths, only update session if there's an auth cookie
  // This allows anonymous users to get cached responses
  const hasAuthCookie = request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token') ||
    Array.from(request.cookies.getAll()).some(c => c.name.includes('supabase'))

  if (isCacheablePath && !hasAuthCookie) {
    return NextResponse.next()
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