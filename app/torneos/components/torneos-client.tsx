"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Trophy, Users, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  type TournamentDisplay,
  getCostDisplay,
  getLocationDisplay,
  getPaceDisplay,
  getTournamentStatusText,
  formatDateRange,
} from "@/lib/tournamentUtils"

// Componente para mostrar un torneo
function TorneoCard({
  torneo,
  tipo,
}: {
  torneo: TournamentDisplay
  tipo: 'upcoming' | 'ongoing' | 'past'
}) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "Horario por confirmar"
    return timeStr
  }

  const formatRounds = (rounds: number | null) => {
    if (!rounds) return "Por definir"
    return `${rounds} rondas`
  }

  return (
    <Card className="border-amber/20 shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3 border-b border-amber/10">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-terracotta">{torneo.title}</CardTitle>
              {torneo.tournament_type === 'team' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  <Users className="h-3 w-3 mr-1" />
                  Por Equipos
                </Badge>
              )}
            </div>
            <CardDescription>{torneo.description || "Información del torneo próximamente"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber" />
            <span className="text-sm">
              {torneo.end_date && torneo.start_date.toDateString() !== torneo.end_date.toDateString()
                ? formatDateRange(torneo.start_date, torneo.end_date)
                : torneo.formatted_start_date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber" />
            <span className="text-sm">{formatTime(torneo.time)}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-amber shrink-0 mt-0.5" />
            <div>
              {torneo.place && (
                <span className="text-sm block text-amber-dark">
                  {torneo.place}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {getLocationDisplay(torneo.place, torneo.location)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber" />
            <span className="text-sm">
              {formatRounds(torneo.rounds)} - {getPaceDisplay(torneo.pace)}
            </span>
          </div>
          {tipo !== "past" && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber" />
              <div>
                <span className="text-sm block">
                  {torneo.inscription_details || "Información de inscripción próximamente"}
                </span>
                <span className="text-sm text-muted-foreground">
                  Costo: {getCostDisplay(torneo.cost)}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber" />
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full text-xs",
              tipo === "upcoming" && "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
              tipo === "ongoing" && "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200", 
              tipo === "past" && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            )}>
              {getTournamentStatusText(torneo)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          asChild
          variant="outline"
          className="flex-1 border-terracotta text-terracotta hover:bg-terracotta/10"
        >
          <Link href={`/torneos/${torneo.id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Torneo
          </Link>
        </Button>
        {tipo === "upcoming" && torneo.registration_link && (
          <Button 
            asChild
            className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white"
          >
            <a href={torneo.registration_link} target="_blank" rel="noopener noreferrer">
              Inscripción
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

interface TorneosClientProps {
  upcomingTournaments: TournamentDisplay[]
  ongoingTournaments: TournamentDisplay[]
  pastTournaments: TournamentDisplay[]
}

export default function TorneosClient({ 
  upcomingTournaments, 
  ongoingTournaments, 
  pastTournaments 
}: TorneosClientProps) {
  return (
    <Tabs defaultValue={ongoingTournaments.length > 0 ? "en-curso" : "proximos"} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted border border-amber/20 mb-8">
        <TabsTrigger value="proximos" className="data-[state=active]:bg-amber data-[state=active]:text-white">
          <span className="hidden sm:inline">Próximos Torneos ({upcomingTournaments.length})</span>
          <span className="sm:hidden">Próximos ({upcomingTournaments.length})</span>
        </TabsTrigger>
        <TabsTrigger value="en-curso" className="data-[state=active]:bg-amber data-[state=active]:text-white">
          <span className="hidden sm:inline">Torneos en Curso ({ongoingTournaments.length})</span>
          <span className="sm:hidden">En Curso ({ongoingTournaments.length})</span>
        </TabsTrigger>
        <TabsTrigger value="pasados" className="data-[state=active]:bg-amber data-[state=active]:text-white">
          <span className="hidden sm:inline">Torneos Pasados ({pastTournaments.length})</span>
          <span className="sm:hidden">Pasados ({pastTournaments.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="proximos">
        {upcomingTournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay torneos próximos programados en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((torneo) => (
              <TorneoCard
                key={torneo.id}
                torneo={torneo}
                tipo="upcoming"
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="en-curso">
        {ongoingTournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay torneos en curso en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ongoingTournaments.map((torneo) => (
              <TorneoCard
                key={torneo.id}
                torneo={torneo}
                tipo="ongoing"
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pasados">
        {pastTournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay torneos pasados registrados.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastTournaments.map((torneo) => (
              <TorneoCard
                key={torneo.id}
                torneo={torneo}
                tipo="past"
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
} 