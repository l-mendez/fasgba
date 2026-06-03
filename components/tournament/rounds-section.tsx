"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Trophy, Users, User, Play, Swords, ChevronDown, ChevronUp } from "lucide-react"
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
      const teamA = oddBoardGame ? oddBoardGame.whiteTeam || teams[0] : teams[0]
      const teamB = oddBoardGame ? oddBoardGame.blackTeam || teams[1] : teams[1]
      
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
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set())
  
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

  // Toggle match expansion
  const toggleMatch = (matchKey: string) => {
    const newExpanded = new Set(expandedMatches)
    if (newExpanded.has(matchKey)) {
      newExpanded.delete(matchKey)
    } else {
      newExpanded.add(matchKey)
    }
    setExpandedMatches(newExpanded)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-terracotta dark:text-terracotta-light">
              {isTeamTournament ? (
                <Swords className="h-6 w-6" />
              ) : (
                <Users className="h-6 w-6" />
              )}
              <span className="text-xl lg:text-2xl">{isTeamTournament ? 'Enfrentamientos' : 'Partidas'}</span>
            </CardTitle>
            
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-32 lg:w-40">
                <SelectValue />
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
          
          <CardDescription className="text-base lg:text-lg">
            <span className="font-semibold text-terracotta dark:text-terracotta-light">Ronda {roundNumber}</span>
            {" • "}
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
      </Card>

      {/* Games/Matches List */}
      <div className="space-y-4 lg:space-y-6">
        {isTeamTournament ? (
          // Team Tournament Layout
          matches.length > 0 ? matches.map((match, matchIndex) => {
            const matchKey = `${match.teamA}-${match.teamB}`
            const isExpanded = expandedMatches.has(matchKey)
            
            return (
              <Card key={matchKey} className="shadow-sm overflow-hidden">
                {/* Match Header - Clickable */}
                <button
                  onClick={() => toggleMatch(matchKey)}
                  className="w-full bg-gradient-to-r from-terracotta/5 to-amber/5 dark:from-terracotta/10 dark:to-amber/10 p-4 lg:p-6 border-b border-border/50 hover:from-terracotta/10 hover:to-amber/10 dark:hover:from-terracotta/15 dark:hover:to-amber/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <span className="text-sm lg:text-base font-medium text-muted-foreground">
                      Enfrentamiento {matchIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={match.status === 'ongoing' ? 'default' : 'outline'}
                        className={cn(
                          "text-sm px-3 py-1",
                          match.status === 'finished' 
                            ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            : match.status === 'ongoing'
                              ? 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        )}
                      >
                        {match.status === 'finished' ? 'Finalizado' : 
                         match.status === 'ongoing' ? 'En curso' : 'Programado'}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 lg:gap-6">
                    <div className="flex-1 text-right">
                      <span className="font-bold text-lg lg:text-xl text-terracotta dark:text-terracotta-light">
                        {match.teamA}
                      </span>
                    </div>
                    <div className="bg-background dark:bg-background rounded-lg px-4 py-2 lg:px-6 lg:py-3 shadow-sm border border-border/30">
                      <span className="font-bold text-xl lg:text-2xl text-foreground">
                        {match.totalScore.teamA} - {match.totalScore.teamB}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-bold text-lg lg:text-xl text-terracotta dark:text-terracotta-light">
                        {match.teamB}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Individual Games - Collapsible */}
                {isExpanded && (
                  <div className="divide-y divide-border/30">
                    {match.games
                      .sort((a, b) => (a.board || 0) - (b.board || 0))
                      .map(game => (
                      <div key={game.id} className="p-4 lg:p-6">
                        <div className="flex items-center justify-between mb-4 lg:mb-6">
                          <span className="text-sm lg:text-base font-medium text-muted-foreground">
                            Mesa {game.board}
                          </span>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={game.result === '*' ? 'default' : 'outline'}
                              className={cn(
                                "text-sm px-3 py-1",
                                game.result !== '*'
                                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                  : 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                              )}
                            >
                              {game.result === '*' ? 'En curso' : game.result}
                            </Badge>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-terracotta dark:text-terracotta-light hover:bg-terracotta/10 dark:hover:bg-terracotta/20"
                            >
                              <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                                Ver partida
                              </Link>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 text-center">
                          <div className="lg:text-right">
                            <div className="font-semibold text-base lg:text-lg text-foreground mb-1">
                              {game.white}
                            </div>
                            {game.whiteRating && (
                              <div className="text-sm text-muted-foreground">
                                Rating: {game.whiteRating}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <span className="text-muted-foreground text-lg font-medium">vs</span>
                          </div>
                          
                          <div className="lg:text-left">
                            <div className="font-semibold text-base lg:text-lg text-foreground mb-1">
                              {game.black}
                            </div>
                            {game.blackRating && (
                              <div className="text-sm text-muted-foreground">
                                Rating: {game.blackRating}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          }) : (
            <Card className="shadow-sm">
              <CardContent className="p-8 lg:p-12 text-center">
                <Trophy className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-base lg:text-lg">
                  {totalRounds >= roundNumber 
                    ? 'Esta ronda aún no ha sido programada' 
                    : 'Esta ronda no existe en el torneo'
                  }
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          // Individual Tournament Layout
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {roundGames?.length > 0 ? roundGames.map(game => (
              <Card key={game.id} className="shadow-sm">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      Mesa {game.board}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={game.result === '*' ? 'default' : 'outline'}
                        className={cn(
                          "text-sm px-3 py-1",
                          game.result !== '*'
                            ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                        )}
                      >
                        {game.result === '*' ? 'En curso' : game.result}
                      </Badge>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-terracotta dark:text-terracotta-light hover:bg-terracotta/10 dark:hover:bg-terracotta/20"
                      >
                        <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="font-semibold text-base lg:text-lg text-foreground mb-1">
                        {game.white}
                      </div>
                      {game.whiteRating && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Rating: {game.whiteRating}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <span className="text-muted-foreground font-medium">vs</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold text-base lg:text-lg text-foreground mb-1">
                        {game.black}
                      </div>
                      {game.blackRating && (
                        <div className="text-sm text-muted-foreground">
                          Rating: {game.blackRating}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="lg:col-span-2 xl:col-span-3">
                <Card className="shadow-sm">
                  <CardContent className="p-8 lg:p-12 text-center">
                    <Users className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-base lg:text-lg">
                      {totalRounds >= roundNumber 
                        ? 'Esta ronda aún no ha sido programada' 
                        : 'Esta ronda no existe en el torneo'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 