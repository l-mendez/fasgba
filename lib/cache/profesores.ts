import { revalidatePath } from 'next/cache'

// Invalidate the cached public profesores pages after a profesor mutation
// (create, edit, delete, photo upload). Both pages are prerendered with
// `revalidate = false`, so this is their only invalidation path.
export function revalidateProfesoresCache(profesorId?: number) {
  revalidatePath('/profesores')
  if (profesorId) revalidatePath(`/profesores/${profesorId}`)
}
