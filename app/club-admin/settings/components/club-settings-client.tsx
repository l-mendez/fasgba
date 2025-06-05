"use client"

import { useClubContext } from "@/app/club-admin/context/club-context"
import { ClubSettingsForm } from "./club-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ClubSettingsClient() {
  const { selectedClub, isLoading, error, hasNoClubs } = useClubContext()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando configuración...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Error al cargar los datos del club: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (hasNoClubs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin acceso</CardTitle>
          <CardDescription>
            No tienes permisos de administrador para ningún club
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!selectedClub) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecciona un club</CardTitle>
          <CardDescription>
            Por favor selecciona un club para configurar
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <ClubSettingsForm club={selectedClub} />
} 