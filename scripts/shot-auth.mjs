// Signs in with SHOT_EMAIL / SHOT_PASSWORD and returns the Supabase session
// cookies as CDP cookie params. Uses @supabase/ssr's own server client so the
// names, chunking and base64- encoding match what the app reads.
import { createServerClient } from '@supabase/ssr'

export async function authCookies(base) {
  const { SHOT_EMAIL: email, SHOT_PASSWORD: password, NEXT_PUBLIC_SUPABASE_URL: url } = process.env
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!email || !password || !url || !key) {
    console.error('--auth needs SHOT_EMAIL and SHOT_PASSWORD (a dedicated dev account) in .env.local, plus NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
    process.exit(1)
  }

  const jar = new Map()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  })
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error(`--auth: sign-in failed for ${email}: ${error.message}`)
    process.exit(1)
  }
  // Not httpOnly: the browser client reads the same cookies from document.cookie.
  return [...jar].map(([name, value]) => ({ name, value, url: base, path: '/', sameSite: 'Lax' }))
}
