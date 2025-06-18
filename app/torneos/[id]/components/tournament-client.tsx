'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Trophy, Clock, Users, DollarSign, Info } from "lucide-react"
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
      {/* Tournament Header - Mobile First */}
      <section className="w-screen max-w-full py-4 sm:py-6 md:py-8 lg:py-12 bg-gradient-to-b from-terracotta/10 to-amber/5 dark:from-terracotta/5 dark:to-amber/5 overflow-hidden">
        <div className="w-full max-w-none px-3 sm:px-4 md:px-6 mx-auto box-border">
          <div className="space-y-3 sm:space-y-4 w-full max-w-full">
            {/* Title and Status */}
            <div className="text-center sm:text-left w-full max-w-full overflow-hidden">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-terracotta dark:text-terracotta-light leading-tight break-words hyphens-auto">
                {tournament.title}
              </h1>
              {tournament.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed break-words hyphens-auto">
                  {tournament.description}
                </p>
              )}
              <div className="mt-3 flex justify-center sm:justify-start w-full overflow-hidden">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs px-2 py-1 max-w-[90%] truncate inline-block",
                    tournament.is_upcoming ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                    tournament.is_ongoing ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                    'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {tournament.is_ongoing ? '🟢 En curso' : tournament.is_upcoming ? '🔵 Próximo' : '⚫ Finalizado'}
                </Badge>
              </div>
            </div>
            
            {/* Quick Info - Mobile Optimized */}
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 space-y-2 border border-white/20 dark:border-gray-700/50 w-full max-w-full overflow-hidden box-border">
              <div className="w-full max-w-full space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                  <Calendar className="h-4 w-4 text-amber dark:text-amber-400 flex-shrink-0" />
                  <span className="font-medium text-foreground truncate">{tournament.formatted_start_date}</span>
                </div>
                {tournament.end_date && tournament.formatted_end_date && 
                  tournament.formatted_start_date !== tournament.formatted_end_date && (
                  <div className="flex items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                    <Calendar className="h-4 w-4 text-amber dark:text-amber-400 flex-shrink-0" />
                    <span className="text-foreground truncate">{tournament.formatted_end_date}</span>
                  </div>
                )}
                {tournament.place && (
                  <div className="flex items-center gap-2 sm:col-span-2 min-w-0 w-full max-w-full overflow-hidden">
                    <MapPin className="h-4 w-4 text-amber dark:text-amber-400 flex-shrink-0" />
                    <span className="truncate text-foreground">{tournament.place}</span>
                  </div>
                )}
                {tournament.time && (
                  <div className="flex items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                    <Clock className="h-4 w-4 text-amber dark:text-amber-400 flex-shrink-0" />
                    <span className="text-foreground truncate">{tournament.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                  <Trophy className="h-4 w-4 text-amber dark:text-amber-400 flex-shrink-0" />
                  <span className="text-foreground truncate">{totalRounds} ronda{totalRounds !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="pt-1 w-full max-w-full overflow-hidden">
                <Badge variant="secondary" className="bg-terracotta/10 dark:bg-terracotta/20 text-terracotta dark:text-terracotta-light border-terracotta/20 dark:border-terracotta/30 text-xs max-w-full truncate inline-block">
                  {tournament.tournament_type === 'team' ? '👥 Por Equipos' : '👤 Individual'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Details - Compact Mobile Layout */}
      <section className="w-screen max-w-full py-3 sm:py-4 bg-muted/20 dark:bg-muted/10 overflow-hidden">
        <div className="w-full max-w-none px-3 sm:px-4 md:px-6 mx-auto box-border">
          <div className="space-y-3 w-full max-w-full">
            {/* Tournament Format - Inline for mobile */}
            <div className="bg-card dark:bg-card rounded-lg p-3 shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
              <div className="flex items-center gap-2 mb-2 w-full max-w-full overflow-hidden">
                <Users className="h-4 w-4 text-terracotta dark:text-terracotta-light flex-shrink-0" />
                <h3 className="font-semibold text-terracotta dark:text-terracotta-light text-sm truncate">Formato</h3>
              </div>
              <div className="space-y-1 text-sm w-full max-w-full">
                <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                  <span className="text-muted-foreground flex-shrink-0 text-xs">Tipo:</span>
                  <span className="font-medium text-foreground text-right truncate text-xs">{tournament.tournament_type === 'team' ? 'Por Equipos' : 'Individual'}</span>
                </div>
                {tournament.tournament_type === 'team' && tournament.players_per_team && (
                  <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                    <span className="text-muted-foreground flex-shrink-0 text-xs">Jugadores/eq:</span>
                    <span className="font-medium text-foreground text-right text-xs">{tournament.players_per_team}</span>
                  </div>
                )}
                {tournament.tournament_type === 'team' && tournament.max_teams && (
                  <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                    <span className="text-muted-foreground flex-shrink-0 text-xs">Máx. equipos:</span>
                    <span className="font-medium text-foreground text-right text-xs">{tournament.max_teams}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                  <span className="text-muted-foreground flex-shrink-0 text-xs">Rondas:</span>
                  <span className="font-medium text-foreground text-right text-xs">{totalRounds}</span>
                </div>
                {tournament.pace && (
                  <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                    <span className="text-muted-foreground flex-shrink-0 text-xs">Ritmo:</span>
                    <span className="font-medium text-right text-foreground truncate text-xs">{tournament.pace}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Registration & Cost - Combined for mobile */}
            {(tournament.registration_deadline || tournament.cost || tournament.inscription_details) && (
              <div className="bg-card dark:bg-card rounded-lg p-3 shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
                <div className="flex items-center gap-2 mb-2 w-full max-w-full overflow-hidden">
                  <DollarSign className="h-4 w-4 text-terracotta dark:text-terracotta-light flex-shrink-0" />
                  <h3 className="font-semibold text-terracotta dark:text-terracotta-light text-sm truncate">Inscripción</h3>
                </div>
                <div className="space-y-1 text-sm w-full max-w-full">
                  {tournament.registration_deadline && (
                    <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                      <span className="text-muted-foreground flex-shrink-0 text-xs">Límite:</span>
                      <span className="font-medium text-foreground text-right truncate text-xs">
                        {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {tournament.cost && (
                    <div className="flex justify-between items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                      <span className="text-muted-foreground flex-shrink-0 text-xs">Costo:</span>
                      <span className="font-medium text-foreground text-right truncate text-xs">{tournament.cost}</span>
                    </div>
                  )}
                  {tournament.inscription_details && (
                    <div className="pt-1 w-full max-w-full overflow-hidden">
                      <p className="text-xs text-muted-foreground mb-1">Detalles:</p>
                      <p className="text-xs text-foreground break-words hyphens-auto">{tournament.inscription_details}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location & Prizes - Combined */}
            {(tournament.location || tournament.prizes) && (
              <div className="bg-card dark:bg-card rounded-lg p-3 shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
                <div className="flex items-center gap-2 mb-2 w-full max-w-full overflow-hidden">
                  <Info className="h-4 w-4 text-terracotta dark:text-terracotta-light flex-shrink-0" />
                  <h3 className="font-semibold text-terracotta dark:text-terracotta-light text-sm truncate">Información Adicional</h3>
                </div>
                <div className="space-y-2 text-sm w-full max-w-full">
                  {tournament.location && (
                    <div className="w-full max-w-full overflow-hidden">
                      <span className="text-muted-foreground text-xs">Dirección:</span>
                      <p className="font-medium text-foreground break-words hyphens-auto text-xs">{tournament.location}</p>
                    </div>
                  )}
                  {tournament.prizes && (
                    <div className="w-full max-w-full overflow-hidden">
                      <span className="text-muted-foreground text-xs">Premios:</span>
                      <p className="font-medium text-foreground break-words hyphens-auto text-xs">{tournament.prizes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tournament Results */}
      <section className="w-screen max-w-full py-4 sm:py-6 md:py-8 overflow-hidden">
        <div className="w-full max-w-none px-3 sm:px-4 md:px-6 mx-auto box-border">
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