"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo para el club
export type Club = {
  id: number
  nombre: string
  logo: string
}

// Definir el tipo para el contexto
type ClubContextType = {
  selectedClub: Club | null
  setSelectedClub: (club: Club) => void
  clubesAdministrados: Club[]
  handleClubChange: (clubId: string) => void
  isLoading: boolean
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
export function ClubContextProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [clubesAdministrados, setClubesAdministrados] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar clubes administrados al iniciar
  useEffect(() => {
    async function loadClubs() {
      try {
        setIsLoading(true)
        
        // Use mock data instead of fetching from Supabase
        const mockClubs: Club[] = [
          { id: 1, nombre: "Club de Ajedrez 1", logo: "/images/club1.png" },
          { id: 2, nombre: "Club de Ajedrez 2", logo: "/images/club2.png" },
        ]
        
        setClubesAdministrados(mockClubs)
        
        // Set the first club as selected by default
        if (mockClubs.length > 0) {
          setSelectedClub(mockClubs[0])
        }
      } catch (error) {
        console.error("Error loading clubs:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadClubs()
  }, [])

  const handleClubChange = (clubId: string) => {
    const club = clubesAdministrados.find(c => c.id === parseInt(clubId))
    if (club) {
      setSelectedClub(club)
    }
  }

  const value = {
    selectedClub,
    setSelectedClub,
    clubesAdministrados,
    handleClubChange,
    isLoading
  }

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  )
}

