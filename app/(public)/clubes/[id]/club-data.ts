import { cache } from "react"
import { getClubById, type ClubWithStats } from "@/lib/clubUtils"

export function parseClubId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// One club lookup per request, shared by the layout, metadata and pages.
export const getClubCached = cache(
  async (id: number) => (await getClubById(id, true).catch(() => null)) as ClubWithStats | null
)
