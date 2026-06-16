import { revalidatePath, revalidateTag } from 'next/cache'

import { ADMIN_RANKING_CACHE_TAG, RANKING_CACHE_TAG } from '@/lib/rankingStorage'
import { clearRankingCache } from '@/lib/rankingUtils'

export function revalidateRankingCache() {
  clearRankingCache()
  revalidateTag(RANKING_CACHE_TAG, 'max')
  revalidateTag(ADMIN_RANKING_CACHE_TAG, 'max')
  revalidatePath('/ranking')
  revalidatePath('/admin/ranking')
}
