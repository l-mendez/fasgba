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
    <div className="px-3 py-3 border-b border-amber/20">
      <div className="text-xs font-medium text-muted-foreground mb-3">
        Club Seleccionado
      </div>
      <Select
        value={selectedClub?.id.toString() || ""}
        onValueChange={handleClubChange}
      >
        <SelectTrigger className="w-full text-left min-h-[2.75rem] py-2">
          <div className="flex items-center space-x-2 w-full">
            <Building2 className="h-4 w-4 text-terracotta flex-shrink-0" />
            <div className="flex-1 text-left">
              <SelectValue placeholder="Selecciona un club">
                <div className="text-sm leading-tight break-words">
                  {selectedClub?.name || "Selecciona un club"}
                </div>
              </SelectValue>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-60 border border-border shadow-lg">
          {clubesAdministrados.map((club) => (
            <SelectItem 
              key={club.id} 
              value={club.id.toString()} 
              className={`!py-3 !px-4 !pl-4 flex items-start min-h-[3rem] ${
                selectedClub?.id === club.id 
                  ? '!bg-terracotta/10 !text-terracotta dark:!bg-terracotta/20 dark:!text-terracotta' 
                  : 'hover:!bg-muted/50 dark:!text-gray-100'
              } [&>span:first-child]:hidden`}
            >
              <div className="w-full">
                <div className="font-medium text-sm leading-tight break-words text-foreground dark:!text-gray-100">{club.name}</div>
                {club.address && (
                  <div className={`text-xs leading-tight mt-1 break-words ${
                    selectedClub?.id === club.id 
                      ? 'text-terracotta/70 dark:!text-terracotta/90' 
                      : 'text-muted-foreground dark:!text-gray-100'
                  }`}>
                    {club.address}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 