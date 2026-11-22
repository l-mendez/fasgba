import { revalidatePath, revalidateTag } from 'next/cache'
import { revalidatePartidasCache } from './partidas'
import { revalidatePartidoPages } from './partidos'

// Invalidate the cached public tournaments listing after a tournament mutation
// (create, edit, delete, type change). Mirrors the 'torneos' tag used by
// getCachedTournaments in app/(public)/torneos/page.tsx and on the home page.
// Both are prerendered with `revalidate = false`, so this is their only
// invalidation path. Round/game/registration sub-routes don't affect either
// listing, so they call revalidatePartidasCache instead.
export function revalidateTorneosCache() {
  revalidateTag('torneos', 'max')
  revalidatePath('/')
  revalidatePath('/torneos')
  revalidatePartidoPages()
  revalidatePartidasCache()
}
