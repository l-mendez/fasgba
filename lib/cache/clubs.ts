import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate every cached public page that shows club data after a club
// mutation (create, edit, delete, settings change, or image upload/removal).
// The 'clubs' tag mirrors getCachedClubs in app/(public)/clubes/page.tsx (also
// consumed by /noticias and the home page). The paths cover / and /clubes (the
// directory itself) plus /arbitraje and /profesores, which render club names
// through a `clubs(name)` join and would otherwise show a renamed or deleted
// club forever. All four are prerendered with `revalidate = false`, so this is
// their only invalidation path. /profesores/[id] renders the same joined club
// name but is not purged here because it renders per request, so it can never
// hold a stale one; it would need a purge here if it ever became prerenderable
// (revalidateProfesoresCache only runs on profesor mutations).
// revalidateTag with the 'max' profile works in Route Handlers, where these
// mutations run; updateTag throws outside Server Actions.
export function revalidateClubsCache() {
  revalidateTag('clubs', 'max')
  revalidatePath('/')
  revalidatePath('/clubes')
  revalidatePath('/arbitraje')
  revalidatePath('/profesores')
}
