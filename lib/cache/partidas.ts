import { revalidateTag } from 'next/cache'

// The sitemap lists every tournament game with a PGN under the 'partidas' tag.
// Game, match and round mutations call this; revalidateTorneosCache covers
// tournament deletes and chess-results imports. Game pages render per request.
export function revalidatePartidasCache() {
  revalidateTag('partidas', 'max')
}
