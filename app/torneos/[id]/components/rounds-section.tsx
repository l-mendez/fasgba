"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Trophy, Users, User, Play } from "lucide-react"
import Link from "next/link"
import { GameDisplay } from "@/lib/gameUtils-client"
import { cn } from "@/lib/utils"

interface RoundsSectionProps {
  totalRounds: number
  gamesByRound: Record<number, GameDisplay[]>
  tournamentId: number
  tournamentType: 'individual' | 'team' | string
}

export default function RoundsSection({ totalRounds, gamesByRound, tournamentId, tournamentType }: RoundsSectionProps) {
  const [selectedRound, setSelectedRound] = useState<string>("1")
  
  const roundNumber = parseInt(selectedRound)
  const roundGames = gamesByRound[roundNumber] || []
  const isTeamTournament = tournamentType === 'team'

  return (
    <div className="lg:col-span-7">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-terracotta" />
            <h2 className="text-xl font-bold text-terracotta">
              {isTeamTournament ? 'Enfrentamientos por Equipos' : 'Rondas del Torneo'}
            </h2>
          </div>
          
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-32 border-amber/20 focus:ring-amber">
              <SelectValue placeholder="Ronda" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: totalRounds}, (_, i) => i + 1).map(roundNum => (
                <SelectItem key={roundNum} value={roundNum.toString()}>
                  Ronda {roundNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Card className="border-amber/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-terracotta text-lg">Ronda {roundNumber}</CardTitle>
            <CardDescription>
              {roundGames?.some(g => g.result === '*') 
                ? isTeamTournament ? 'Enfrentamientos en curso' : 'Partidas en curso'
                : roundGames?.length > 0 
                  ? isTeamTournament ? 'Enfrentamientos finalizados' : 'Partidas finalizadas'
                  : 'Ronda aún no programada'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {roundGames?.map(game => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-amber/10 hover:bg-amber/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {isTeamTournament ? `Mesa ${game.board}` : game.board}
                    </Badge>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex flex-col gap-1 min-w-0">
                        {isTeamTournament && game.whiteTeam ? (
                          <>
                            <span className="font-medium text-sm text-terracotta truncate">{game.whiteTeam}</span>
                            <span className="text-xs text-muted-foreground truncate">{game.white}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium truncate">{game.white}</span>
                            {game.whiteRating && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({game.whiteRating})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                      <div className="flex flex-col gap-1 min-w-0">
                        {isTeamTournament && game.blackTeam ? (
                          <>
                            <span className="font-medium text-sm text-terracotta truncate">{game.blackTeam}</span>
                            <span className="text-xs text-muted-foreground truncate">{game.black}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium truncate">{game.black}</span>
                            {game.blackRating && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({game.blackRating})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={game.result === '*' ? 'default' : 'outline'}
                      className={cn(
                        "flex-shrink-0",
                        game.result 
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                      )}
                    >
                      {game.result === '*' ? 'En juego' : game.result}
                    </Badge>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs hover:bg-amber/10 hover:text-terracotta"
                    >
                      <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                        <Play className="h-3 w-3 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-8">
                  {totalRounds >= roundNumber 
                    ? 'Ronda aún no programada' 
                    : 'Esta ronda no existe en el torneo'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 