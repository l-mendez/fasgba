"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { SELECTED_CLUB_COOKIE, type ClubAdminClub } from "@/lib/club-admin/types"

// Definir el tipo para el club según la API
export type Club = ClubAdminClub

// Definir el tipo para el contexto
type ClubContextType = {
  selectedClub: Club | null
  setSelectedClub: (club: Club) => void
  clubesAdministrados: Club[]
  handleClubChange: (clubId: string) => void
  isLoading: boolean
  error: string | null
  hasNoClubs: boolean
}

// Crear el contexto con un valor por defecto
const ClubContext = createContext<ClubContextType | null>(null)

// Hook personalizado para usar el contexto del club
export const useClubContext = () => {
  const context = useContext(ClubContext)
  if (!context) {
    throw new Error("useClubContext debe ser usado dentro de un ClubContextProvider")
  }
  return context
}

// Proveedor del contexto
export function ClubContextProvider({
  children,
  initialClubs,
  initialSelectedClub,
}: {
  children: ReactNode
  initialClubs: Club[]
  initialSelectedClub: Club | null
}) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(initialSelectedClub)
  const [clubesAdministrados] = useState<Club[]>(initialClubs)
  const isLoading = false
  const error: string | null = null
  const hasNoClubs = clubesAdministrados.length === 0

  const handleClubChange = (clubId: string) => {
    const club = clubesAdministrados.find(c => c.id === parseInt(clubId))
    if (club) {
      setSelectedClub(club)
      // Read by getClubAdminContext so reloads keep the selection.
      document.cookie = `${SELECTED_CLUB_COOKIE}=${club.id}; path=/; max-age=31536000; samesite=lax`
    }
  }

  const value = {
    selectedClub,
    setSelectedClub,
    clubesAdministrados,
    handleClubChange,
    isLoading,
    error,
    hasNoClubs
  }

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  )
}
