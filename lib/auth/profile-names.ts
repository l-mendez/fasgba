import type { User } from '@supabase/supabase-js'
import type { DbClient } from '@/lib/db-types'

type Names = { nombre: string; apellido: string }

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/**
 * Nombre/apellido from the OAuth provider's claims (Google sends given_name and
 * family_name; otherwise split full_name at the first space).
 */
export function namesFromProvider(user: User): Names | null {
  const sources = [user.user_metadata, ...(user.identities ?? []).map((i) => i.identity_data)]

  for (const claims of sources) {
    const nombre = text(claims?.given_name)
    if (nombre) return { nombre, apellido: text(claims?.family_name) }
  }

  for (const claims of sources) {
    const fullName = text(claims?.full_name) || text(claims?.name)
    if (fullName) {
      const [nombre, ...rest] = fullName.split(/\s+/)
      return { nombre, apellido: rest.join(' ') }
    }
  }

  return null
}

/**
 * The app reads user_metadata.nombre/apellido (set by the signup form). Fill
 * them from the provider on the first OAuth sign-in; never overwrite them.
 */
export async function ensureProfileNames(supabase: DbClient, user: User) {
  if (text(user.user_metadata?.nombre)) return

  const names = namesFromProvider(user)
  if (!names) return

  const { error } = await supabase.auth.updateUser({ data: names })
  if (error) console.error('Could not save profile names:', error.message)
}
