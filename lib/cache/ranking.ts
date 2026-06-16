import { revalidatePath, revalidateTag } from 'next/cache'

import { ADMIN_RANKING_CACHE_TAG, RANKING_CACHE_TAG } from '@/lib/rankingStorage'

export function revalidateRankingCache() {
  revalidateTag(RANKING_CACHE_TAG, 'max')
  revalidateTag(ADMIN_RANKING_CACHE_TAG, 'max')
  revalidatePath('/ranking')
  revalidatePath('/admin/ranking')
}
