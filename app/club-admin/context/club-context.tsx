"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"

// Definir el tipo para el club según la API
export type Club = {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

// Definir el tipo para el contexto
type ClubContextType = {
  selectedClub: Club | null
  setSelectedClub: (club: Club) => void
  clubesAdministrados: Club[]
  handleClubChange: (clubId: string) => void
  isLoading: boolean
  error: string | null
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

// Helper function para hacer llamadas a la API
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const url = `/api${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  return response.json()
}

// Helper functions
async function getAdminClubs(userId: string): Promise<Club[]> {
  try {
    return await apiCall('/users/me/admin-clubs')
  } catch (error) {
    console.error('Error fetching admin clubs:', error)
    return []
  }
}

function getMockClubs(): Club[] {
  return [
    { 
      id: 1, 
      name: "Club de Ajedrez Central", 
      address: "Av. Corrientes 1234, CABA",
      telephone: "+54-11-1234-5678",
      mail: "admin@clubcentral.com",
      schedule: "Lunes a Viernes 18:00-22:00"
    },
    { 
      id: 2, 
      name: "Club Gambito de Rey", 
      address: "Calle San Martín 567, La Plata",
      telephone: "+54-221-9876-5432",
      mail: "contacto@gambitoderey.com",
      schedule: "Martes y Jueves 19:00-23:00"
    },
  ]
}

// Proveedor del contexto
export function ClubContextProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [clubesAdministrados, setClubesAdministrados] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Cargar clubes administrados al iniciar
  useEffect(() => {
    const loadAdminClubs = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)
        
        // Get admin clubs for the current user
        const adminClubs = await getAdminClubs(user.id)
        
        if (adminClubs && adminClubs.length > 0) {
          setClubesAdministrados(adminClubs)
          if (!selectedClub) {
            setSelectedClub(adminClubs[0])
          }
        } else {
          // Fallback to mock data for testing
          const mockClubs = getMockClubs()
          setClubesAdministrados(mockClubs)
          if (!selectedClub) {
            setSelectedClub(mockClubs[0])
          }
        }
      } catch (err) {
        console.error('Error loading admin clubs:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar clubes')
        // Fallback to mock data
        const mockClubs = getMockClubs()
        setClubesAdministrados(mockClubs)
        if (!selectedClub) {
          setSelectedClub(mockClubs[0])
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminClubs()
  }, [user?.id]) // Removed selectedClub from dependencies to prevent infinite loop

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
    isLoading,
    error
  }

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  )
}

