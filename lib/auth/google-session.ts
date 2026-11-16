import { createClient } from '@/lib/supabase/client'
import { ensureProfileNames } from '@/lib/auth/profile-names'

// Set on sign-out so One Tap asks for a click instead of signing straight back
// in. Cleared by the next Google sign-in. GIS keeps its own flag too, but only
// on pages where its script has loaded.
const AUTO_SELECT_OFF_KEY = 'fasgba:google-auto-select-off'

function setAutoSelectOff(off: boolean) {
  try {
    if (off) window.localStorage.setItem(AUTO_SELECT_OFF_KEY, '1')
    else window.localStorage.removeItem(AUTO_SELECT_OFF_KEY)
  } catch {
    // Storage unavailable (private mode): GIS's own flag still applies.
  }
}

export function isGoogleAutoSelectOff() {
  try {
    return window.localStorage.getItem(AUTO_SELECT_OFF_KEY) === '1'
  } catch {
    return false
  }
}

/** Call on every sign-out. */
export function disableGoogleAutoSelect() {
  setAutoSelectOff(true)
  window.google?.accounts.id.disableAutoSelect()
}

/** Exchanges a Google ID token (button or One Tap) for a Supabase session. */
export async function signInWithGoogleCredential(credential: string, nonce: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
    nonce,
  })
  if (error || !data.user) return { user: null, error: error?.message ?? 'No user returned' }
  await ensureProfileNames(supabase, data.user)
  setAutoSelectOff(false)
  return { user: data.user, error: null }
}
