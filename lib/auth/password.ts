import type { User } from '@supabase/supabase-js'

/**
 * Whether the user can sign in with a password. Email signups always have one;
 * OAuth-only users get has_password once they set one: app_metadata from
 * /ajustes, user_metadata from the reset flow. A user can set the
 * user_metadata flag themselves, but it only makes the current password required.
 */
export function userHasPassword(user: Pick<User, 'app_metadata' | 'user_metadata'>) {
  const providers: unknown = user.app_metadata?.providers
  const hasEmailIdentity =
    user.app_metadata?.provider === 'email' || (Array.isArray(providers) && providers.includes('email'))
  return (
    hasEmailIdentity ||
    user.app_metadata?.has_password === true ||
    user.user_metadata?.has_password === true
  )
}
