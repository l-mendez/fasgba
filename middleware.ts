import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // TEMPORARY: Disable middleware for debugging
  // Remove this bypass after testing
  console.log('🚧 MIDDLEWARE BYPASSED FOR DEBUGGING')
  return res

  const supabase = createMiddlewareClient({ req, res })

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      console.log('🔒 Middleware: Checking admin access for:', req.nextUrl.pathname)
      
      // Get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('👤 Session exists:', !!session?.user)
      console.log('🔐 Session error:', sessionError)
      
      // If no session, redirect to 404
      if (!session?.user) {
        console.log('❌ No session found, redirecting to 404')
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      console.log('👤 User ID:', session.user.id)

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('auth_id')
        .eq('auth_id', session.user.id)
        .single()

      console.log('🔍 Admin query result:', { adminData, adminError })

      // If user is not admin or there's an error (except "no rows"), redirect to 404
      if (adminError && adminError.code !== 'PGRST116') {
        console.log('❌ Admin query error (not no-rows):', adminError)
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      if (!adminData) {
        console.log('❌ User is not admin, redirecting to 404')
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      console.log('✅ Admin access granted')
      // User is authenticated and is admin, allow access
      return res
    } catch (error) {
      console.error('💥 Middleware error:', error)
      // On any error, redirect to 404 for security
      return NextResponse.redirect(new URL('/not-found', req.url))
    }
  }

  // For club-admin routes, we can add similar logic here if needed
  if (req.nextUrl.pathname.startsWith('/club-admin')) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      // Check if user is club admin
      const { count, error: clubAdminError } = await supabase
        .from('club_admins')
        .select('*', { count: 'exact', head: true })
        .eq('auth_id', session.user.id)

      if (clubAdminError || (count || 0) === 0) {
        return NextResponse.redirect(new URL('/not-found', req.url))
      }

      return res
    } catch (error) {
      console.error('Club admin middleware error:', error)
      return NextResponse.redirect(new URL('/not-found', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/club-admin/:path*',
  ],
} 