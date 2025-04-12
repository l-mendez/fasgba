"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { getSupabaseClient, ensureSession } from "@/lib/supabase-client"

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

  // Inicializar cliente de Supabase
  const supabase = getSupabaseClient()

  // Cargar clubes administrados al iniciar
  useEffect(() => {
    async function loadClubs() {
      try {
        setIsLoading(true)
        
        // Get the current user's auth ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Error getting user:", userError)
          return
        }
        
        // Get the user's ID from the users table
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single()
        
        if (userDataError || !userData) {
          console.error("Error getting user data:", userDataError)
          return
        }
        
        // Get the clubs that the user is an admin for
        const { data: clubAdmins, error: clubAdminsError } = await supabase
          .from("club_admins")
          .select("club_id")
          .eq("user_id", userData.id)
        
        if (clubAdminsError) {
          console.error("Error getting club admins:", clubAdminsError)
          return
        }
        
        if (!clubAdmins || clubAdmins.length === 0) {
          console.error("User is not a club admin")
          return
        }
        
        // Get the club details
        const clubIds = clubAdmins.map(ca => ca.club_id)
        const { data: clubs, error: clubsError } = await supabase
          .from("clubs")
          .select("id, name")
          .in("id", clubIds)
        
        if (clubsError) {
          console.error("Error getting clubs:", clubsError)
          return
        }
        
        // Transform the clubs data to match the Club type
        const formattedClubs: Club[] = clubs.map(club => ({
          id: club.id,
          nombre: club.name,
          logo: "/placeholder.svg?height=40&width=40" // Default logo
        }))
        
        setClubesAdministrados(formattedClubs)
        
        // Seleccionamos el primer club por defecto
        if (formattedClubs.length > 0 && !selectedClub) {
          setSelectedClub(formattedClubs[0])
        }
      } catch (error) {
        console.error('Error cargando clubes administrados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadClubs()
  }, [supabase, selectedClub])

  // Cambiar el club seleccionado
  const handleClubChange = (clubId: string) => {
    const club = clubesAdministrados.find((c) => c.id.toString() === clubId)
    if (club) {
      setSelectedClub(club)
    }
  }

  return (
    <ClubContext.Provider
      value={{
        selectedClub,
        setSelectedClub,
        clubesAdministrados,
        handleClubChange,
        isLoading
      }}
    >
      {children}
    </ClubContext.Provider>
  )
}

