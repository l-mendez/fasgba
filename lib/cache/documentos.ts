import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate the cached public documents listing after a documento mutation
// (upload, edit, delete, reorder, importance settings). Mirrors the 'documentos'
// tag used by getCachedPublicDocumentos in app/(public)/documentos/page.tsx.
export function revalidateDocumentosCache() {
  revalidateTag('documentos', 'max')
  revalidatePath('/documentos')
}
