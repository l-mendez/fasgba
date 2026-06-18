'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Edit, Trash2 } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'

interface GamesListProps {
  selectedRound: number
  games: GameDisplay[]
  loading: boolean
  onEditGame: (game: GameDisplay) => void
  onDeleteGame: (game: GameDisplay) => void
}

function getResultBadgeClass(result: string) {
  switch (result) {
    case '1-0': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
    case '0-1': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
    case '1/2-1/2': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }
}

export function GamesList({
  selectedRound,
  games,
  loading,
  onEditGame,
  onDeleteGame,
}: GamesListProps) {
  if (selectedRound === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">Selecciona una ronda</p>
        <p className="text-sm">Elige una ronda para ver y gestionar sus partidas</p>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No hay partidas en esta ronda</p>
        <p className="text-sm">Agrega la primera partida para comenzar</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {games.map((game) => (
        <Card key={game.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">
                  Mesa {game.board || 'N/A'}
                </CardTitle>
                <Badge className={getResultBadgeClass(game.result)}>
                  {game.result === '*' ? 'En juego' : game.result}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditGame(game)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteGame(game)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{game.white}</p>
                {game.whiteRating && (
                  <p className="text-sm text-gray-500">Rating: {game.whiteRating}</p>
                )}
                {game.whiteTeam && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">{game.whiteTeam}</p>
                )}
              </div>
              <div>
                <p className="font-medium">{game.black}</p>
                {game.blackRating && (
                  <p className="text-sm text-gray-500">Rating: {game.blackRating}</p>
                )}
                {game.blackTeam && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">{game.blackTeam}</p>
                )}
              </div>
            </div>
            {(game.date || game.time) && (
              <div className="mt-2 text-sm text-gray-500">
                {game.date} {game.time}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
