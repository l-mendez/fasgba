'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Trophy, Clock, Users, DollarSign, Info, ExternalLink } from "lucide-react"
import { type TournamentDisplay } from "@/lib/tournamentUtils"
import { type GameDisplay } from "@/lib/gameUtils-client"
import RoundsSection from "./rounds-section"
import { cn } from "@/lib/utils"

interface RegisteredTeamDisplay {
  team_id: number
  name: string
  club_name: string
}

interface TournamentClientProps {
  tournament: TournamentDisplay
  initialGamesByRound: Record<number, GameDisplay[]>
  initialTotalRounds: number
  tournamentId: number
  registeredTeams?: RegisteredTeamDisplay[]
}

export default function TournamentClient({
  tournament,
  initialGamesByRound,
  initialTotalRounds,
  tournamentId,
  registeredTeams = []
}: TournamentClientProps) {
  const [gamesByRound, setGamesBytournamentTypeRound] = useState(initialGamesByRound)
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds)

  return (
    <div className="min-h-screen bg-background">
      {/* Tournament Header */}
      <section className="py-8 lg:py-16 bg-gradient-to-b from-terracotta/10 to-amber/5 dark:from-terracotta/5 dark:to-amber/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title and Status */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-terracotta dark:text-terracotta-light leading-tight mb-4">
                {tournament.title}
              </h1>
              {tournament.description && (
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed mb-6 max-w-3xl">
                  {tournament.description}
                </p>
              )}
              <div className="flex justify-center lg:justify-start">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-sm px-4 py-2 font-medium",
                    tournament.is_upcoming ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                    tournament.is_ongoing ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                    'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {tournament.is_ongoing ? 'En curso' : tournament.is_upcoming ? 'Próximo' : 'Finalizado'}
                </Badge>
              </div>
            </div>
            
            {/* Quick Info Grid */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-white/30 dark:border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                    <p className="font-semibold text-foreground">{tournament.formatted_start_date}</p>
                  </div>
                </div>
                
                {tournament.end_date && tournament.formatted_end_date && 
                  tournament.formatted_start_date !== tournament.formatted_end_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de fin</p>
                      <p className="font-semibold text-foreground">{tournament.formatted_end_date}</p>
                    </div>
                  </div>
                )}
                
                {tournament.time && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horario</p>
                      <p className="font-semibold text-foreground">{tournament.time}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rondas</p>
                    <p className="font-semibold text-foreground">{totalRounds} ronda{totalRounds !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Modalidad</p>
                    <p className="font-semibold text-foreground">{tournament.tournament_type === 'team' ? 'Por Equipos' : 'Individual'}</p>
                  </div>
                </div>
                
                {tournament.place && (
                  <div className="flex items-center gap-3 md:col-span-2 lg:col-span-1">
                    <MapPin className="h-5 w-5 text-amber dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lugar</p>
                      <p className="font-semibold text-foreground">{tournament.place}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Details */}
      <section className="py-8 lg:py-12 bg-muted/30 dark:bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Tournament Format Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-terracotta dark:text-terracotta-light">
                    <Users className="h-5 w-5" />
                    Formato del Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{tournament.tournament_type === 'team' ? 'Por Equipos' : 'Individual'}</span>
                    </div>
                    
                    {tournament.tournament_type === 'team' && tournament.players_per_team && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Jugadores por equipo:</span>
                        <span className="font-medium">{tournament.players_per_team}</span>
                      </div>
                    )}
                    
                    {tournament.tournament_type === 'team' && tournament.max_teams && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Máximo de equipos:</span>
                        <span className="font-medium">{tournament.max_teams}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Número de rondas:</span>
                      <span className="font-medium">{totalRounds}</span>
                    </div>
                    
                    {tournament.pace && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ritmo de juego:</span>
                        <span className="font-medium">{tournament.pace}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Registration & Cost Card */}
              {(tournament.registration_deadline || tournament.cost || tournament.inscription_details || tournament.registration_link) && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-terracotta dark:text-terracotta-light">
                      <DollarSign className="h-5 w-5" />
                      Inscripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tournament.registration_deadline && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fecha límite:</span>
                        <span className="font-medium">
                          {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                    
                    {tournament.cost && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Costo:</span>
                        <span className="font-medium">{tournament.cost}</span>
                      </div>
                    )}
                    
                    {tournament.inscription_details && (
                      <div>
                        <p className="text-muted-foreground mb-2">Detalles de inscripción:</p>
                        <p className="text-sm leading-relaxed">{tournament.inscription_details}</p>
                      </div>
                    )}
                    
                    {tournament.registration_link && tournament.is_upcoming && (
                      <Button 
                        asChild
                        className="w-full bg-terracotta hover:bg-terracotta/90 text-white mt-4"
                      >
                        <a href={tournament.registration_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Inscribirse al Torneo
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Location & Prizes Card */}
              {(tournament.location || tournament.prizes) && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-terracotta dark:text-terracotta-light">
                      <Info className="h-5 w-5" />
                      Información Adicional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tournament.location && (
                      <div>
                        <p className="text-muted-foreground mb-2">Dirección:</p>
                        <p className="font-medium leading-relaxed">{tournament.location}</p>
                      </div>
                    )}
                    
                    {tournament.prizes && (
                      <div>
                        <p className="text-muted-foreground mb-2">Premios:</p>
                        <p className="font-medium leading-relaxed">{tournament.prizes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Registered Teams (team tournaments only) */}
      {tournament.tournament_type === 'team' && registeredTeams.length > 0 && (
        <section className="py-8 lg:py-12 bg-muted/30 dark:bg-muted/20 border-t border-border/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-5 w-5 text-terracotta dark:text-terracotta-light" />
                <h2 className="text-xl lg:text-2xl font-bold text-terracotta dark:text-terracotta-light">
                  Equipos Participantes
                </h2>
                <Badge variant="outline" className="text-sm">
                  {registeredTeams.length} equipo{registeredTeams.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registeredTeams.map((team) => (
                  <Card key={team.team_id} className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{team.name}</p>
                        <p className="text-sm text-muted-foreground">{team.club_name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tournament Results */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <RoundsSection 
            totalRounds={totalRounds} 
            gamesByRound={gamesByRound} 
            tournamentId={tournamentId}
            tournamentType={tournament.tournament_type || 'individual'}
          />
        </div>
      </section>
    </div>
  )
} 