"use client"

import { useClubContext } from "@/app/club-admin/context/club-context"
import { ClubSettingsForm } from "./club-settings-form"
import { ErrorAlert } from "@/components/error-alert"

export function ClubSettingsClient() {
  const { selectedClub, isLoading, error, hasNoClubs } = useClubContext()

  if (isLoading) {
    return null
  }

  if (error) {
    return <ErrorAlert title="Error" message={`Error al cargar los datos del club: ${error}`} />
  }

  if (hasNoClubs) {
    return (
      <p className="text-sm text-muted-foreground">No administras ningún club.</p>
    )
  }

  if (!selectedClub) {
    return (
      <p className="text-sm text-muted-foreground">Selecciona un club.</p>
    )
  }

  return <ClubSettingsForm club={selectedClub} />
} 
