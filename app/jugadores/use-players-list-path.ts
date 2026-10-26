"use client"

import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

// List page to return to: club-admin links pass ?from=club-admin, so users who
// are both admins go back where they started. Otherwise pick by role.
export function usePlayersListPath() {
  const from = useSearchParams()?.get("from")
  const { isAdmin } = useAuth()
  if (from === "club-admin" || !isAdmin) return "/club-admin/jugadores"
  return "/admin/jugadores"
}
