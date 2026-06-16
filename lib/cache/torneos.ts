import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate the cached public tournaments listing after a tournament mutation
// (create, edit, delete, type change). Mirrors the 'torneos' tag used by
// getCachedTournaments in app/(public)/torneos/page.tsx. Round/game/registration
// sub-routes don't affect the listing, so they don't call this.
export function revalidateTorneosCache() {
  revalidateTag('torneos', 'max')
  revalidatePath('/torneos')
}
