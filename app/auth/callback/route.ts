import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureProfileNames } from '@/lib/auth/profile-names'
import { safeRedirectPath } from '@/lib/auth/redirect'

// OAuth redirect flow (PKCE): Supabase sends the user back here with ?code=.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const destination = (next && safeRedirectPath(next)) || '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      await ensureProfileNames(supabase, data.user)
      return NextResponse.redirect(new URL(destination, origin))
    }
    console.error('OAuth code exchange failed:', error.message)
  }

  const login = new URL('/login', origin)
  login.searchParams.set('error', 'oauth')
  if (destination !== '/') login.searchParams.set('redirect', destination)
  return NextResponse.redirect(login)
}
