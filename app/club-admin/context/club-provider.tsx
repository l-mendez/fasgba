"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  image?: string | null
  created_at: string
  updated_at: string
}

interface ClubContextType {
  clubs: Club[]
  selectedClub: Club | null
  setSelectedClub: (club: Club | null) => void
  isLoading: boolean
  hasNoClubs: boolean
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

interface ClubProviderProps {
  children: ReactNode
  initialClubs: Club[]
  initialSelectedClub: Club | null
}

export function ClubProvider({ children, initialClubs, initialSelectedClub }: ClubProviderProps) {
  const [clubs] = useState<Club[]>(initialClubs)
  const [selectedClub, setSelectedClub] = useState<Club | null>(initialSelectedClub)
  const [isLoading] = useState(false)
  const hasNoClubs = clubs.length === 0

  return (
    <ClubContext.Provider 
      value={{
        clubs,
        selectedClub,
        setSelectedClub,
        isLoading,
        hasNoClubs
      }}
    >
      {children}
    </ClubContext.Provider>
  )
}

export function useClubContext() {
  const context = useContext(ClubContext)
  if (context === undefined) {
    throw new Error('useClubContext must be used within a ClubProvider')
  }
  return context
} 