'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Users } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { Match } from './types'

interface MatchesListProps {
  matches: Match[]
  games: GameDisplay[]
  loading: boolean
  onEditMatch: (match: Match) => void
  onDeleteMatch: (match: Match) => void
}

export function MatchesList({
  matches,
  games,
  loading,
  onEditMatch,
  onDeleteMatch,
}: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No hay enfrentamientos en esta ronda</p>
        <p className="text-sm">Los enfrentamientos se configuran al crear la ronda</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {match.team_a.name} vs {match.team_b.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditMatch(match)}
                  disabled={loading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteMatch(match)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Equipo A: {match.team_a.name}</span>
              <span>vs</span>
              <span>Equipo B: {match.team_b.name}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {(() => {
                const matchGames = games.filter(game => game.matchId === match.id)
                return `${matchGames.length} ${matchGames.length === 1 ? 'partida' : 'partidas'}`
              })()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
