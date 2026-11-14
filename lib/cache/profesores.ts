import { revalidatePath, revalidateTag } from 'next/cache'
import { revalidatePartidoPages } from './partidos'

// Invalidate the cached public profesores pages after a profesor mutation
// (create, edit, delete, photo upload). /profesores is prerendered with
// `revalidate = false`, so this is its only invalidation path. /profesores/[id]
// renders per request today, so purging it is a guard for the day it becomes
// prerenderable, not a live purge. The 'profesores' tag mirrors the cached
// sitemap data in app/sitemap.ts.
export function revalidateProfesoresCache(profesorId?: number) {
  revalidateTag('profesores', 'max')
  revalidatePath('/profesores')
  if (profesorId) revalidatePath(`/profesores/${profesorId}`)
  revalidatePartidoPages()
}
