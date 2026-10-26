"use client"

import { ChessResultsImportButton } from "@/components/chess-results/chess-results-import-button"
import { useClubContext } from "../context/club-context"

/** Import from chess-results for the club selected in the club-admin panel. */
export function ClubAdminChessResultsImport() {
  const { selectedClub } = useClubContext()
  if (!selectedClub) return null
  return (
    <div className="flex justify-end">
      <ChessResultsImportButton club={{ id: selectedClub.id, name: selectedClub.name }} className="w-full sm:w-auto" />
    </div>
  )
}
