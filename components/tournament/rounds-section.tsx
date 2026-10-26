"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GameDisplay } from "@/lib/gameUtils-client"

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

// Compact result label ("½-½" instead of "1/2-1/2").
function formatResult(result: GameDisplay["result"]) {
  return result === "*" ? null : result.replace(/1\/2/g, "½")
}

// Match points with "½" instead of ".5" (4.5 -> "4½", 0.5 -> "½").
function formatPoints(points: number) {
  const whole = Math.floor(points)
  const half = points - whole >= 0.5 ? "½" : ""
  return whole === 0 && half ? half : `${whole}${half}`
}

function PlayerCell({ name, rating, align }: { name: string; rating?: number; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0"}>
      <p className="break-words font-medium sm:truncate" title={name}>{name}</p>
      {rating ? <p className="text-xs text-muted-foreground tabular-nums">{rating}</p> : null}
    </div>
  )
}

// One game per row; the whole row links to the game viewer.
function GameRow({ game, tournamentId }: { game: GameDisplay; tournamentId: number }) {
  const result = formatResult(game.result)
  return (
    <li>
      <Link
        href={`/torneos/${tournamentId}/partidas/${game.id}`}
        className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-amber/10 sm:px-4"
      >
        {game.board != null && (
          <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums" title={`Mesa ${game.board}`}>
            {game.board}
          </span>
        )}
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <PlayerCell name={game.white} rating={game.whiteRating} align="right" />
          {result ? (
            <span className="min-w-[3.25rem] rounded-md border px-2 py-0.5 text-center font-semibold tabular-nums">
              {result}
            </span>
          ) : (
            <span className="flex min-w-[3.25rem] justify-center" title="En curso">
              <PlayCircle className="h-4 w-4 text-amber" />
            </span>
          )}
          <PlayerCell name={game.black} rating={game.blackRating} align="left" />
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}

// Match header: stacked "team / score" rows on mobile, "A score B" from sm up.
function MatchHeader({ match }: { match: MatchGroup }) {
  const started = match.status !== "not_started"
  const scoreA = started ? formatPoints(match.totalScore.teamA) : ""
  const scoreB = started ? formatPoints(match.totalScore.teamB) : ""
  return (
    <div className="min-w-0 flex-1">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:hidden">
        <span className="break-words font-semibold">{match.teamA}</span>
        <span className="min-w-[2rem] text-center text-lg font-bold tabular-nums">{scoreA}</span>
        <span className="break-words font-semibold">{match.teamB}</span>
        <span className="min-w-[2rem] text-center text-lg font-bold tabular-nums">{scoreB}</span>
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:grid">
        <span className="truncate text-right font-semibold" title={match.teamA}>{match.teamA}</span>
        <span className="min-w-[5.5rem] rounded-md border bg-background px-3 py-1 text-center text-lg font-bold tabular-nums">
          {started ? `${scoreA} - ${scoreB}` : "vs"}
        </span>
        <span className="truncate font-semibold" title={match.teamB}>{match.teamB}</span>
      </div>
      {match.status === "ongoing" && (
        <div className="mt-1.5 sm:flex sm:justify-center">
          <InfoPill icon={PlayCircle}>En curso</InfoPill>
        </div>
      )}
    </div>
  )
}

const sortByBoard = (games: GameDisplay[]) => [...games].sort((a, b) => (a.board || 0) - (b.board || 0))

export default function RoundsSection({ totalRounds, gamesByRound, tournamentId, tournamentType }: RoundsSectionProps) {
  // Rounds that actually have games; the selector covers every planned round.
  const playedRounds = useMemo(
    () => Object.keys(gamesByRound).map(Number).filter((r) => gamesByRound[r]?.length > 0),
    [gamesByRound]
  )
  const roundCount = Math.max(totalRounds, ...playedRounds, 0)
  const [selectedRound, setSelectedRound] = useState<string>(String(Math.max(...playedRounds, 1)))
  // Matches start expanded so board results are visible without extra clicks.
  const [collapsedMatches, setCollapsedMatches] = useState<Set<string>>(new Set())

  const roundNumber = parseInt(selectedRound)
  const roundGames = useMemo(() => gamesByRound[roundNumber] || [], [gamesByRound, roundNumber])
  const isTeamTournament = tournamentType === 'team'

  const matches = useMemo(
    () => (isTeamTournament ? groupGamesByMatch(roundGames) : []),
    [roundGames, isTeamTournament]
  )

  if (playedRounds.length === 0) return null

  const toggleMatch = (matchKey: string) => {
    const next = new Set(collapsedMatches)
    if (next.has(matchKey)) next.delete(matchKey)
    else next.add(matchKey)
    setCollapsedMatches(next)
  }

  const goToRound = (round: number) => setSelectedRound(String(round))
  const isEmpty = isTeamTournament ? matches.length === 0 : roundGames.length === 0

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-terracotta">
          {isTeamTournament ? "Enfrentamientos" : "Partidas"}
        </h2>
        {roundCount > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={roundNumber <= 1}
              onClick={() => goToRound(roundNumber - 1)}
              aria-label="Ronda anterior"
              title="Ronda anterior"
            >
              <ChevronLeft />
            </Button>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="h-9 w-32" aria-label="Ronda">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: roundCount }, (_, i) => i + 1).map((roundNum) => (
                  <SelectItem key={roundNum} value={roundNum.toString()}>
                    Ronda {roundNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={roundNumber >= roundCount}
              onClick={() => goToRound(roundNumber + 1)}
              aria-label="Ronda siguiente"
              title="Ronda siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Ronda sin partidas cargadas.
        </p>
      ) : isTeamTournament ? (
        <div className="space-y-3">
          {matches.map((match) => {
            const matchKey = `${match.teamA}-${match.teamB}`
            const isExpanded = !collapsedMatches.has(matchKey)

            return (
              <div key={matchKey} className="overflow-hidden rounded-lg border bg-card">
                <button
                  type="button"
                  onClick={() => toggleMatch(matchKey)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-amber/10 sm:px-4"
                >
                  <MatchHeader match={match} />
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <ul className="divide-y border-t">
                    {sortByBoard(match.games).map((game) => (
                      <GameRow key={game.id} game={game} tournamentId={tournamentId} />
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {sortByBoard(roundGames).map((game) => (
            <GameRow key={game.id} game={game} tournamentId={tournamentId} />
          ))}
        </ul>
      )}
    </div>
  )
}
