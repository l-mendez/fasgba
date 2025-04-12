import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  const res = NextResponse.next()
  
  // Create a Supabase client with the request and response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // For admin and club-admin routes, we'll allow access without authentication
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/club-admin')) {
    return res
  }

  // For login page, check if user is already logged in
  if (req.nextUrl.pathname === '/login') {
    try {
      // Check for any Supabase auth cookies
      const hasAuthCookie = req.cookies.has('sb-auth-token') || 
                           req.cookies.has('sb-access-token') || 
                           req.cookies.has('sb-refresh-token')
      
      if (hasAuthCookie) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking auth cookies in middleware:', error)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/club-admin/:path*',
    '/login',
  ],
} 