'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
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
      <p className="py-8 text-center text-sm text-muted-foreground">No hay enfrentamientos en esta ronda.</p>
    )
  }

  return (
    <div className="grid gap-3">
      {matches.map((match) => {
        const gamesCount = games.filter(game => game.matchId === match.id).length
        return (
          <Card key={match.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {match.team_a.name} vs {match.team_b.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {gamesCount} {gamesCount === 1 ? 'partida' : 'partidas'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Editar enfrentamiento"
              title="Editar enfrentamiento"
              onClick={() => onEditMatch(match)}
              disabled={loading}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              aria-label="Eliminar enfrentamiento"
              title="Eliminar enfrentamiento"
              onClick={() => onDeleteMatch(match)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
