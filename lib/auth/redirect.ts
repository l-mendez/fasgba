// Pages that should never be the post-login destination.
const AUTH_PATHS = ['/login', '/registro', '/recuperar-contrasena', '/confirmar-email', '/auth']

const BASE = 'http://same-origin.invalid'

/**
 * The same-origin path ("/x?y#z") for a redirect target, or null if it would
 * leave the site or land on an auth page. Parsed with URL, not string checks:
 * browsers strip tabs/newlines and treat "\\" as "/", so "/\t/evil.com" is
 * really "//evil.com".
 */
export function safeRedirectPath(path: string): string | null {
  if (!path.startsWith('/')) return null
  let url: URL
  try {
    url = new URL(path, BASE)
  } catch {
    return null
  }
  if (url.origin !== BASE) return null
  if (AUTH_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null
  return url.pathname + url.search + url.hash
}

/**
 * Where to send the user after signing in (browser only).
 * Priority: ?redirect= param > same-origin referrer > home.
 */
export function getPostLoginDestination(searchParams: Pick<URLSearchParams, 'get'> | null) {
  const redirectParam = searchParams?.get('redirect') || searchParams?.get('redirectTo')
  const fromParam = redirectParam && safeRedirectPath(redirectParam)
  if (fromParam) return fromParam

  if (typeof window !== 'undefined' && document.referrer) {
    const referrer = new URL(document.referrer)
    const path = referrer.pathname + referrer.search
    const fromReferrer = referrer.origin === window.location.origin && safeRedirectPath(path)
    if (fromReferrer) return fromReferrer
  }

  return '/'
}
