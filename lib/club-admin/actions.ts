"use server"

import { getClubAdminContext, queryClubPlayers } from "@/lib/club-admin/initial-data"
import type { ClubPlayersPage, ClubPlayersScope } from "@/lib/club-admin/types"

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function listClubPlayersAction(input: {
  scope: ClubPlayersScope
  search?: string
  page?: number
}): Promise<ActionResult<ClubPlayersPage>> {
  const { clubs } = await getClubAdminContext()
  if (input.scope !== "none" && !clubs.some((club) => club.id === input.scope)) {
    return { ok: false, error: "No tienes acceso a este club" }
  }

  try {
    const data = await queryClubPlayers(input.scope, input.search ?? "", input.page ?? 1)
    return { ok: true, data }
  } catch (error) {
    console.error("Error listing club players:", error)
    return { ok: false, error: "Error al cargar jugadores" }
  }
}
