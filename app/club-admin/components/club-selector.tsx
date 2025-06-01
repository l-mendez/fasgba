"use client"

import { ChevronDown, AlertCircle, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useClubContext } from "../context/club-context"

export function ClubSelector() {
  const { selectedClub, clubesAdministrados, handleClubChange, isLoading, error } = useClubContext()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Cargando clubes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-3 my-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Error al cargar clubes: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (clubesAdministrados.length === 0) {
    return (
      <div className="px-3 py-2">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            No administras ningún club
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-b border-amber/20">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Club Seleccionado
      </div>
      <Select
        value={selectedClub?.id.toString() || ""}
        onValueChange={handleClubChange}
      >
        <SelectTrigger className="w-full text-left">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-terracotta" />
            <SelectValue placeholder="Selecciona un club">
              {selectedClub?.name || "Selecciona un club"}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {clubesAdministrados.map((club) => (
            <SelectItem key={club.id} value={club.id.toString()}>
              <div className="flex flex-col">
                <span className="font-medium">{club.name}</span>
                {club.address && (
                  <span className="text-xs text-muted-foreground">
                    {club.address}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 