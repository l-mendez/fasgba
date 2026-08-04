import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate every cached public page that shows club data after a club
// mutation (create, edit, delete, settings change, or image upload/removal).
// The 'clubs' tag mirrors getCachedClubs in app/(public)/clubes/page.tsx (also
// consumed by /noticias and the home page). The paths cover / and /clubes (the
// directory itself) plus /arbitraje and /profesores, which render club names
// through a `clubs(name)` join and would otherwise show a renamed or deleted
// club forever. /profesores/[id] renders per request today, so purging it is a
// no-op guard in case it becomes prerenderable. Prerendered routes are cached
// with `revalidate = false`, so this is their only invalidation path. revalidateTag
// with the 'max' profile works in Route Handlers, where these mutations run;
// updateTag throws outside Server Actions.
export function revalidateClubsCache() {
  revalidateTag('clubs', 'max')
  revalidatePath('/')
  revalidatePath('/clubes')
  revalidatePath('/arbitraje')
  revalidatePath('/profesores')
  revalidatePath('/profesores/[id]', 'page')
}
