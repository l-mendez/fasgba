import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate the cached public clubs directory after a club mutation (create,
// edit, delete, settings change, or image upload/removal). Mirrors the 'clubs'
// tag used by getCachedClubs in app/(public)/clubes/page.tsx (also consumed by
// /noticias and the home page). Those routes are prerendered with
// `revalidate = false`, so this is their only invalidation path. revalidateTag
// with the 'max' profile works in Route Handlers, where these mutations run;
// updateTag throws outside Server Actions.
export function revalidateClubsCache() {
  revalidateTag('clubs', 'max')
  revalidatePath('/')
  revalidatePath('/clubes')
}
