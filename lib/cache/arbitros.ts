import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate the cached public arbitros listing after an arbitro mutation
// (create, edit, delete). Mirrors the 'arbitros' tag used by getCachedArbitros
// in app/(public)/arbitraje/page.tsx.
export function revalidateArbitrosCache() {
  revalidateTag('arbitros', 'max')
  revalidatePath('/arbitraje')
}
