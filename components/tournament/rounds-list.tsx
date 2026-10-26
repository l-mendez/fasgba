'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Trash2 } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { Round } from './types'

interface RoundsListProps {
  rounds: Round[]
  games: GameDisplay[]
  selectedRound: number
  onSelectRound: (roundId: number) => void
  loading: boolean
  onDeleteRound: (roundId: number, roundNumber: number) => void
}

export function RoundsList({
  rounds,
  games,
  selectedRound,
  onSelectRound,
  loading,
  onDeleteRound,
}: RoundsListProps) {
  if (rounds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No hay rondas creadas.</p>
    )
  }

  const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number)

  return (
    <div className="flex flex-wrap gap-3">
      {sortedRounds.map((round) => {
        const roundGames = games.filter(game => {
          const gameRoundId = rounds.find(r => r.round_number === game.round)?.id
          return gameRoundId === round.id
        })

        const isSelected = selectedRound === round.id

        return (
          <div
            key={round.id}
            className={`flex items-center gap-1 rounded-lg border pr-1 ${
              isSelected ? 'border-amber bg-accent' : 'bg-card hover:border-amber'
            }`}
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelectRound(round.id)}
              aria-pressed={isSelected}
            >
              <Calendar className="h-4 w-4 text-amber" />
              <span>
                <span className="block text-sm font-medium">Ronda {round.round_number}</span>
                <span className="block text-xs text-muted-foreground">
                  {roundGames.length} {roundGames.length === 1 ? 'partida' : 'partidas'}
                </span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ronda ${round.round_number}`}
              title="Eliminar ronda"
              onClick={() => onDeleteRound(round.id, round.round_number)}
              disabled={loading}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
