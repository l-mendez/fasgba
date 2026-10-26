'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InfoPill } from '@/components/info-pill'
import { CheckCircle2, Pencil, PlayCircle, Trash2 } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'

interface GamesListProps {
  selectedRound: number
  games: GameDisplay[]
  loading: boolean
  onEditGame: (game: GameDisplay) => void
  onDeleteGame: (game: GameDisplay) => void
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
      <p className="py-8 text-center text-sm text-muted-foreground">Selecciona una ronda.</p>
    )
  }

  if (games.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No hay partidas en esta ronda.</p>
    )
  }

  return (
    <div className="grid gap-3">
      {games.map((game) => (
        <Card key={game.id} className="p-4">
          <div className="flex items-center gap-3">
            <p className="font-medium">Mesa {game.board || 'N/A'}</p>
            <InfoPill icon={game.result === '*' ? PlayCircle : CheckCircle2}>
              {game.result === '*' ? 'En juego' : game.result}
            </InfoPill>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              aria-label="Editar partida"
              title="Editar partida"
              onClick={() => onEditGame(game)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              aria-label="Eliminar partida"
              title="Eliminar partida"
              onClick={() => onDeleteGame(game)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {[
              { name: game.white, rating: game.whiteRating, team: game.whiteTeam },
              { name: game.black, rating: game.blackRating, team: game.blackTeam },
            ].map((side, i) => (
              <div key={i} className="min-w-0">
                <p className="truncate font-medium">{side.name}</p>
                {(side.rating || side.team) && (
                  <p className="truncate text-muted-foreground">
                    {[side.rating, side.team].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          {(game.date || game.time) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {game.date} {game.time}
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}
