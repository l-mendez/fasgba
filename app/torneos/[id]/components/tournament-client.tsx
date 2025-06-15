'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Trophy, Clock } from "lucide-react"
import { type TournamentDisplay } from "@/lib/tournamentUtils"
import { type GameDisplay } from "@/lib/gameUtils-client"
import RoundsSection from "./rounds-section"
import { cn } from "@/lib/utils"

interface TournamentClientProps {
  tournament: TournamentDisplay
  initialGamesByRound: Record<number, GameDisplay[]>
  initialTotalRounds: number
  tournamentId: number
}

export default function TournamentClient({
  tournament,
  initialGamesByRound,
  initialTotalRounds,
  tournamentId
}: TournamentClientProps) {
  const [gamesByRound, setGamesBytournamentTypeRound] = useState(initialGamesByRound)
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds)

  return (
    <>
      {/* Tournament Header */}
      <section className="w-full py-8 md:py-12 bg-gradient-to-b from-terracotta/10 to-amber/5">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-terracotta">
                  {tournament.title}
                </h1>
                {tournament.description && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    {tournament.description}
                  </p>
                )}
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "border-amber text-sm",
                  tournament.is_upcoming ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700' :
                  tournament.is_ongoing ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                )}
              >
                {tournament.is_ongoing ? 'En curso' : tournament.is_upcoming ? 'Próximo' : 'Finalizado'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber" />
                <span>{tournament.formatted_start_date}</span>
                {tournament.end_date && tournament.formatted_end_date && 
                  tournament.formatted_start_date !== tournament.formatted_end_date && (
                  <span> - {tournament.formatted_end_date}</span>
                )}
              </div>
              {tournament.place && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber" />
                  <span>{tournament.place}</span>
                </div>
              )}
              {tournament.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber" />
                  <span>{tournament.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber" />
                <span>{totalRounds} rondas</span>
              </div>
              {/* Tournament Type Badge */}
              <Badge variant="secondary" className="bg-terracotta/10 text-terracotta border-terracotta/20">
                {tournament.tournament_type === 'team' ? 'Por Equipos' : 'Individual'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Info Cards */}
      <section className="w-full py-6 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tournament Type Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-terracotta">Formato del Torneo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {tournament.tournament_type === 'team' ? 'Por Equipos' : 'Individual'}
                  </span>
                </div>
                {tournament.tournament_type === 'team' && tournament.players_per_team && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jugadores por equipo:</span>
                    <span className="font-medium">{tournament.players_per_team}</span>
                  </div>
                )}
                {tournament.tournament_type === 'team' && tournament.max_teams && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Máximo de equipos:</span>
                    <span className="font-medium">{tournament.max_teams}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rondas:</span>
                  <span className="font-medium">{totalRounds}</span>
                </div>
                {tournament.pace && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ritmo:</span>
                    <span className="font-medium">{tournament.pace}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration Info */}
            {(tournament.registration_deadline || tournament.cost || tournament.inscription_details) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-terracotta">Inscripción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tournament.registration_deadline && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha límite:</span>
                      <span className="font-medium">
                        {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {tournament.cost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo:</span>
                      <span className="font-medium">{tournament.cost}</span>
                    </div>
                  )}
                  {tournament.inscription_details && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-1">Detalles:</p>
                      <p className="text-sm">{tournament.inscription_details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location & Prizes */}
            {(tournament.location || tournament.prizes) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-terracotta">Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tournament.location && (
                    <div>
                      <span className="text-muted-foreground text-sm">Dirección:</span>
                      <p className="font-medium">{tournament.location}</p>
                    </div>
                  )}
                  {tournament.prizes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Premios:</span>
                      <p className="font-medium">{tournament.prizes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Tournament Results */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <RoundsSection 
            totalRounds={totalRounds} 
            gamesByRound={gamesByRound} 
            tournamentId={tournamentId}
            tournamentType={tournament.tournament_type || 'individual'}
          />
        </div>
      </section>
    </>
  )
} 