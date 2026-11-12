import { revalidatePath } from 'next/cache'

import { PARTIDOS } from '@/lib/partidos'

// Partido landing pages list clubs, profesores, torneos and top players. Paths
// are literal: a '[partido]' pattern would need the (public) group prefix.
export function revalidatePartidoPages() {
  revalidatePath('/ajedrez')
  for (const { slug } of PARTIDOS) revalidatePath(`/ajedrez/${slug}`)
}
