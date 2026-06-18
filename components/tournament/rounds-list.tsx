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
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No hay rondas creadas</p>
        <p className="text-sm">Agrega la primera ronda para comenzar a organizar las partidas</p>
      </div>
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
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
              selectedRound === round.id
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelectRound(round.id)}
          >
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${
                selectedRound === round.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Calendar className={`h-4 w-4 ${
                  selectedRound === round.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <p className="font-medium text-sm">Ronda {round.round_number}</p>
                <p className="text-xs text-gray-500">
                  {roundGames.length} {roundGames.length === 1 ? 'partida' : 'partidas'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteRound(round.id, round.round_number)
              }}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 ml-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
