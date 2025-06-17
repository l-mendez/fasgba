"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Trophy, Users, User, Play, Swords } from "lucide-react"
import Link from "next/link"
import { GameDisplay } from "@/lib/gameUtils-client"
import { cn } from "@/lib/utils"

interface RoundsSectionProps {
  totalRounds: number
  gamesByRound: Record<number, GameDisplay[]>
  tournamentId: number
  tournamentType: 'individual' | 'team' | string
}

// Interface for grouped match data
interface MatchGroup {
  teamA: string
  teamB: string
  games: GameDisplay[]
  totalScore: { teamA: number; teamB: number }
  status: 'ongoing' | 'finished' | 'not_started'
}

// Function to group team games by match
function groupGamesByMatch(games: GameDisplay[]): MatchGroup[] {
  const matchMap = new Map<string, MatchGroup>()
  
  games.forEach(game => {
    if (!game.whiteTeam || !game.blackTeam) return
    
    // Create a consistent match key regardless of board number
    // Sort team names to ensure consistent grouping
    const teams = [game.whiteTeam, game.blackTeam].sort()
    const matchKey = teams.join(' vs ')
    
    if (!matchMap.has(matchKey)) {
      // Find the first odd board game to determine team order
      const oddBoardGame = games.find(g => 
        g.whiteTeam && g.blackTeam && 
        [g.whiteTeam, g.blackTeam].sort().join(' vs ') === matchKey &&
        (g.board || 1) % 2 === 1
      )
      
      // If we have an odd board game, use its white team as teamA
      // Otherwise, use alphabetical order
      const teamA = oddBoardGame ? oddBoardGame.whiteTeam : teams[0]
      const teamB = oddBoardGame ? oddBoardGame.blackTeam : teams[1]
      
      matchMap.set(matchKey, {
        teamA,
        teamB,
        games: [],
        totalScore: { teamA: 0, teamB: 0 },
        status: 'not_started'
      })
    }
    
    const match = matchMap.get(matchKey)!
    match.games.push(game)
    
    // Calculate scores based on game results - simply award points to the winning team
    if (game.result !== '*') {
      if (game.result === '1/2-1/2') {
        // Draw - each team gets 0.5 points
        match.totalScore.teamA += 0.5
        match.totalScore.teamB += 0.5
      } else if (game.result === '1-0') {
        // White won - award point to white's team
        if (game.whiteTeam === match.teamA) {
          match.totalScore.teamA += 1
        } else {
          match.totalScore.teamB += 1
        }
      } else if (game.result === '0-1') {
        // Black won - award point to black's team
        if (game.blackTeam === match.teamA) {
          match.totalScore.teamA += 1
        } else {
          match.totalScore.teamB += 1
        }
      }
    }
  })
  
  // Update match status
  matchMap.forEach(match => {
    const hasOngoingGames = match.games.some(game => game.result === '*')
    const hasFinishedGames = match.games.some(game => game.result !== '*')
    
    if (hasOngoingGames) {
      match.status = 'ongoing'
    } else if (hasFinishedGames) {
      match.status = 'finished'
    } else {
      match.status = 'not_started'
    }
  })
  
  return Array.from(matchMap.values()).sort((a, b) => {
    // Sort by team names for consistency
    return a.teamA.localeCompare(b.teamA)
  })
}

export default function RoundsSection({ totalRounds, gamesByRound, tournamentId, tournamentType }: RoundsSectionProps) {
  const [selectedRound, setSelectedRound] = useState<string>("1")
  
  const roundNumber = parseInt(selectedRound)
  const roundGames = gamesByRound[roundNumber] || []
  const isTeamTournament = tournamentType === 'team'

  // Group team games by match
  const matches = useMemo(() => {
    if (isTeamTournament) {
      return groupGamesByMatch(roundGames)
    }
    return []
  }, [roundGames, isTeamTournament])

  return (
    <div className="lg:col-span-7">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTeamTournament ? (
              <Swords className="h-5 w-5 text-terracotta" />
            ) : (
              <Users className="h-5 w-5 text-terracotta" />
            )}
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
              {isTeamTournament ? (
                matches.length > 0 ? (
                  matches.some(m => m.status === 'ongoing') 
                    ? 'Enfrentamientos en curso' 
                    : matches.some(m => m.status === 'finished')
                      ? 'Enfrentamientos finalizados'
                      : 'Enfrentamientos programados'
                ) : 'Ronda aún no programada'
              ) : (
                roundGames?.some(g => g.result === '*') 
                  ? 'Partidas en curso'
                  : roundGames?.length > 0 
                    ? 'Partidas finalizadas'
                    : 'Ronda aún no programada'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {isTeamTournament ? (
                // Team Tournament - Show matches grouped
                matches.length > 0 ? matches.map((match, matchIndex) => (
                  <Card key={`${match.teamA}-${match.teamB}`} className="border-amber/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            Enfrentamiento {matchIndex + 1}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-terracotta">{match.teamA}</span>
                            <span className="text-lg font-bold text-muted-foreground">
                              {match.totalScore.teamA} - {match.totalScore.teamB}
                            </span>
                            <span className="font-semibold text-terracotta">{match.teamB}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={match.status === 'ongoing' ? 'default' : 'outline'}
                          className={cn(
                            match.status === 'finished' 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                              : match.status === 'ongoing'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                          )}
                        >
                          {match.status === 'finished' ? 'Finalizado' : 
                           match.status === 'ongoing' ? 'En curso' : 'Programado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-2">
                        {match.games
                          .sort((a, b) => (a.board || 0) - (b.board || 0))
                          .map(game => (
                          <div 
                            key={game.id} 
                            className="flex items-center justify-between p-2 rounded border border-amber/5 hover:bg-amber/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                Mesa {game.board}
                              </Badge>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium truncate">{game.white}</span>
                                  {game.whiteRating && (
                                    <span className="text-xs text-muted-foreground">
                                      ({game.whiteRating})
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium truncate">{game.black}</span>
                                  {game.blackRating && (
                                    <span className="text-xs text-muted-foreground">
                                      ({game.blackRating})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={game.result === '*' ? 'default' : 'outline'}
                                className={cn(
                                  "flex-shrink-0 text-xs",
                                  game.result !== '*'
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
                                className="h-7 px-2 text-xs hover:bg-amber/10 hover:text-terracotta"
                              >
                                <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                                  <Play className="h-3 w-3 mr-1" />
                                  Ver
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-muted-foreground text-center py-8">
                    {totalRounds >= roundNumber 
                      ? 'Ronda aún no programada' 
                      : 'Esta ronda no existe en el torneo'
                    }
                  </p>
                )
              ) : (
                // Individual Tournament - Show games individually  
                roundGames?.map(game => (
                  <div 
                    key={game.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-amber/10 hover:bg-amber/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {game.board}
                      </Badge>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium truncate">{game.white}</span>
                          {game.whiteRating && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({game.whiteRating})
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium truncate">{game.black}</span>
                          {game.blackRating && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({game.blackRating})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={game.result === '*' ? 'default' : 'outline'}
                        className={cn(
                          "flex-shrink-0",
                          game.result !== '*'
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
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 