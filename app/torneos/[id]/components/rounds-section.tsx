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
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header - Mobile First */}
      <div className="bg-card dark:bg-card rounded-lg p-3 shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
        <div className="flex items-center justify-between mb-3 w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {isTeamTournament ? (
              <Swords className="h-4 w-4 text-terracotta dark:text-terracotta-light flex-shrink-0" />
            ) : (
              <Users className="h-4 w-4 text-terracotta dark:text-terracotta-light flex-shrink-0" />
            )}
            <h2 className="font-bold text-terracotta dark:text-terracotta-light text-xs sm:text-sm truncate">
              {isTeamTournament ? 'Enfrentamientos' : 'Partidas'}
            </h2>
          </div>
          
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-20 h-8 text-xs border-amber/20 dark:border-amber/30 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: totalRounds}, (_, i) => i + 1).map(roundNum => (
                <SelectItem key={roundNum} value={roundNum.toString()}>
                  R{roundNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-center w-full max-w-full overflow-hidden">
          <h3 className="font-semibold text-terracotta dark:text-terracotta-light text-sm">Ronda {roundNumber}</h3>
          <p className="text-xs text-muted-foreground mt-1 break-words hyphens-auto">
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
          </p>
        </div>
      </div>

      {/* Games/Matches List - Mobile Optimized */}
      <div className="space-y-3 w-full max-w-full overflow-hidden">
        {isTeamTournament ? (
          // Team Tournament - Collapsible mobile layout
          matches.length > 0 ? matches.map((match, matchIndex) => {
            const matchKey = `${match.teamA}-${match.teamB}`
            const isExpanded = expandedMatches.has(matchKey)
            
            return (
              <div key={matchKey} className="bg-card dark:bg-card rounded-lg shadow-sm overflow-hidden border border-border/50 w-full max-w-full box-border">
                {/* Match Header - Clickable */}
                <button
                  onClick={() => toggleMatch(matchKey)}
                  className="w-full bg-gradient-to-r from-terracotta/5 to-amber/5 dark:from-terracotta/10 dark:to-amber/10 p-3 border-b border-border/50 hover:from-terracotta/10 hover:to-amber/10 dark:hover:from-terracotta/15 dark:hover:to-amber/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2 w-full max-w-full overflow-hidden">
                    <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                      Enfrentamiento {matchIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={match.status === 'ongoing' ? 'default' : 'outline'}
                        className={cn(
                          "text-xs flex-shrink-0",
                          match.status === 'finished' 
                            ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            : match.status === 'ongoing'
                              ? 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        )}
                      >
                        {match.status === 'finished' ? '✓' : 
                         match.status === 'ongoing' ? '⏳' : '⏸️'}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="text-center w-full max-w-full overflow-hidden">
                    <div className="flex items-center justify-center gap-1 w-full max-w-full min-w-0">
                      <span className="font-semibold text-terracotta dark:text-terracotta-light text-xs truncate flex-1 text-right max-w-[35%]">
                        {match.teamA}
                      </span>
                      <div className="bg-background dark:bg-background rounded px-2 py-1 shadow-sm border border-border/30 flex-shrink-0">
                        <span className="font-bold text-sm text-foreground whitespace-nowrap">
                          {match.totalScore.teamA}-{match.totalScore.teamB}
                        </span>
                      </div>
                      <span className="font-semibold text-terracotta dark:text-terracotta-light text-xs truncate flex-1 text-left max-w-[35%]">
                        {match.teamB}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Individual Games - Collapsible */}
                {isExpanded && (
                  <div className="divide-y divide-border/30 w-full max-w-full">
                    {match.games
                      .sort((a, b) => (a.board || 0) - (b.board || 0))
                      .map(game => (
                      <div key={game.id} className="p-3 w-full max-w-full overflow-hidden">
                        <div className="flex items-center justify-between mb-2 gap-1 w-full max-w-full overflow-hidden">
                          <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                            Mesa {game.board}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge 
                              variant={game.result === '*' ? 'default' : 'outline'}
                              className={cn(
                                "text-xs",
                                game.result !== '*'
                                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                  : 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                              )}
                            >
                              {game.result === '*' ? '⏳' : game.result}
                            </Badge>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1 text-xs text-terracotta dark:text-terracotta-light hover:bg-terracotta/10 dark:hover:bg-terracotta/20"
                            >
                              <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs w-full max-w-full min-w-0">
                          <div className="text-center min-w-0 max-w-full overflow-hidden">
                            <div className="font-medium truncate text-foreground">{game.white}</div>
                            {game.whiteRating && (
                              <div className="text-xs text-muted-foreground">({game.whiteRating})</div>
                            )}
                          </div>
                          <div className="text-center text-muted-foreground text-xs flex items-center justify-center flex-shrink-0">
                            vs
                          </div>
                          <div className="text-center min-w-0 max-w-full overflow-hidden">
                            <div className="font-medium truncate text-foreground">{game.black}</div>
                            {game.blackRating && (
                              <div className="text-xs text-muted-foreground">({game.blackRating})</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="bg-card dark:bg-card rounded-lg p-6 text-center shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-muted-foreground text-sm break-words hyphens-auto">
                {totalRounds >= roundNumber 
                  ? 'Ronda aún no programada' 
                  : 'Esta ronda no existe en el torneo'
                }
              </p>
            </div>
          )
        ) : (
          // Individual Tournament - Simplified mobile layout
          roundGames?.length > 0 ? roundGames.map(game => (
            <div key={game.id} className="bg-card dark:bg-card rounded-lg p-3 shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
              <div className="flex items-center justify-between mb-2 gap-1 w-full max-w-full overflow-hidden">
                <Badge variant="outline" className="text-xs border-border flex-shrink-0">
                  Mesa {game.board}
                </Badge>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant={game.result === '*' ? 'default' : 'outline'}
                    className={cn(
                      "text-xs",
                      game.result !== '*'
                        ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                    )}
                  >
                    {game.result === '*' ? '⏳' : game.result}
                  </Badge>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-xs text-terracotta dark:text-terracotta-light hover:bg-terracotta/10 dark:hover:bg-terracotta/20"
                  >
                    <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs w-full max-w-full min-w-0">
                <div className="text-center min-w-0 max-w-full overflow-hidden">
                  <div className="font-medium truncate text-foreground">{game.white}</div>
                  {game.whiteRating && (
                    <div className="text-xs text-muted-foreground">({game.whiteRating})</div>
                  )}
                </div>
                <div className="text-center text-muted-foreground text-xs flex items-center justify-center flex-shrink-0">
                  vs
                </div>
                <div className="text-center min-w-0 max-w-full overflow-hidden">
                  <div className="font-medium truncate text-foreground">{game.black}</div>
                  {game.blackRating && (
                    <div className="text-xs text-muted-foreground">({game.blackRating})</div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-card dark:bg-card rounded-lg p-6 text-center shadow-sm border border-border/50 w-full max-w-full overflow-hidden box-border">
              <div className="text-4xl mb-2">♟️</div>
              <p className="text-muted-foreground text-sm break-words hyphens-auto">
                {totalRounds >= roundNumber 
                  ? 'Ronda aún no programada' 
                  : 'Esta ronda no existe en el torneo'
                }
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
} 