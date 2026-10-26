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

        return (
          <div
            key={round.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedRound === round.id ? 'border-amber bg-accent' : 'bg-card hover:border-amber'
            }`}
            onClick={() => onSelectRound(round.id)}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber" />
              <div>
                <p className="font-medium text-sm">Ronda {round.round_number}</p>
                <p className="text-xs text-muted-foreground">
                  {roundGames.length} {roundGames.length === 1 ? 'partida' : 'partidas'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ronda ${round.round_number}`}
              title="Eliminar ronda"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteRound(round.id, round.round_number)
              }}
              disabled={loading}
              className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
