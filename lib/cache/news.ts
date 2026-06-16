import { revalidatePath, revalidateTag } from 'next/cache'

// Invalidate the cached public news pages after a news mutation (create, edit,
// delete). Mirrors the 'news' tag used by getCachedAllNews/getCachedTags in
// app/(public)/noticias/page.tsx. The home page lists news but is force-dynamic,
// so it needs no invalidation. revalidateTag uses the 'max' profile because
// updateTag only works inside Server Actions (it throws in Route Handlers, where
// news is created).
export function revalidateNewsCache(newsId?: number) {
  revalidateTag('news', 'max')
  revalidatePath('/noticias')
  if (newsId) revalidatePath(`/noticias/${newsId}`)
}
