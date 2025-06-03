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

// Proveedor del contexto
export function ClubContextProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [clubesAdministrados, setClubesAdministrados] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasNoClubs, setHasNoClubs] = useState(false)
  const { user } = useAuth()

  // Cargar clubes administrados al iniciar
  useEffect(() => {
    const loadAdminClubs = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)
        setHasNoClubs(false)
        
        // Get admin clubs for the current user
        const adminClubs = await getAdminClubs(user.id)
        
        if (adminClubs && adminClubs.length > 0) {
          setClubesAdministrados(adminClubs)
          if (!selectedClub) {
            setSelectedClub(adminClubs[0])
          }
          setHasNoClubs(false)
        } else {
          // User has no admin clubs - this is an unauthorized access scenario
          setClubesAdministrados([])
          setSelectedClub(null)
          setHasNoClubs(true)
        }
      } catch (err) {
        console.error('Error loading admin clubs:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar clubes')
        setClubesAdministrados([])
        setSelectedClub(null)
        setHasNoClubs(true)
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
    error,
    hasNoClubs
  }

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  )
}

