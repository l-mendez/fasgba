import { revalidatePath, updateTag } from 'next/cache'

// Invalidate the cached public clubs directory after a club mutation (create,
// edit, delete, settings change, or image upload/removal). Mirrors the 'clubs'
// tag used by getCachedClubs in app/(public)/clubes/page.tsx.
export function revalidateClubsCache() {
  updateTag('clubs')
  revalidatePath('/clubes')
}
