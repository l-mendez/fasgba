import { revalidatePath } from 'next/cache'

// Invalidate the cached public profesores pages after a profesor mutation
// (create, edit, delete, photo upload). /profesores is prerendered with
// `revalidate = false`, so this is its only invalidation path. /profesores/[id]
// renders per request today, so purging it is a guard for the day it becomes
// prerenderable, not a live purge.
export function revalidateProfesoresCache(profesorId?: number) {
  revalidatePath('/profesores')
  if (profesorId) revalidatePath(`/profesores/${profesorId}`)
}
