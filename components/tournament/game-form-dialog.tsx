'use client'

import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { GameFormData, Match, Player } from './types'

interface GameFormDialogProps {
  mode: 'add' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentType: 'individual' | 'team'
  gameFormData: GameFormData
  setGameFormData: Dispatch<SetStateAction<GameFormData>>
  matches: Match[]
  players: Player[]
  editingGame?: GameDisplay | null
  loading: boolean
  onSubmit: () => void
}

// White/black dropdowns are filtered to whichever team plays that color on this board.
// Team A plays white on odd boards, team B on even (standard alternating colors).
export function GameFormDialog({
  mode,
  open,
  onOpenChange,
  tournamentType,
  gameFormData,
  setGameFormData,
  matches,
  players,
  editingGame,
  loading,
  onSubmit,
}: GameFormDialogProps) {
  const getWhitePlayerOptions = (): Player[] => {
    if (tournamentType !== 'team' || !gameFormData.match_id || !gameFormData.board_number) {
      return players
    }
    const selectedMatch = matches.find(m => m.id === gameFormData.match_id)
    if (!selectedMatch) return []
    const isOddBoard = gameFormData.board_number % 2 === 1
    const whiteTeamId = isOddBoard ? selectedMatch.team_a.id : selectedMatch.team_b.id
    return players.filter(p => p.team?.id === whiteTeamId)
  }

  const getBlackPlayerOptions = (): Player[] => {
    if (tournamentType !== 'team' || !gameFormData.match_id || !gameFormData.board_number) {
      return players
    }
    const selectedMatch = matches.find(m => m.id === gameFormData.match_id)
    if (!selectedMatch) return []
    const isOddBoard = gameFormData.board_number % 2 === 1
    const blackTeamId = isOddBoard ? selectedMatch.team_b.id : selectedMatch.team_a.id
    return players.filter(p => p.team?.id === blackTeamId)
  }

  const getSelectedMatchInfo = () => {
    if (!gameFormData.match_id) return null
    const selectedMatch = matches.find(m => m.id === gameFormData.match_id)
    if (!selectedMatch) return null

    const isOddBoard = (gameFormData.board_number || 1) % 2 === 1
    return {
      whiteTeam: isOddBoard ? selectedMatch.team_a.name : selectedMatch.team_b.name,
      blackTeam: isOddBoard ? selectedMatch.team_b.name : selectedMatch.team_a.name,
      isOddBoard
    }
  }

  const colorAssignmentInfo = (gameFormData.match_id && (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
        Asignación de Colores por Mesa
      </p>
      {(() => {
        const matchInfo = getSelectedMatchInfo()
        return matchInfo ? (
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Mesa {gameFormData.board_number || 1}: <strong>{matchInfo.whiteTeam}</strong> juega con blancas, <strong>{matchInfo.blackTeam}</strong> juega con negras
          </p>
        ) : null
      })()}
    </div>
  )) || null

  const playerSelects = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="white_player">Jugador Blancas *</Label>
        <Select value={gameFormData.white_player_id.toString()} onValueChange={(value) =>
          setGameFormData(prev => ({ ...prev, white_player_id: parseInt(value) }))
        }>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar jugador" />
          </SelectTrigger>
          <SelectContent>
            {getWhitePlayerOptions().map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.full_name} {player.rating && `(${player.rating})`}
                {player.club && ` - ${player.club.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="black_player">Jugador Negras *</Label>
        <Select value={gameFormData.black_player_id.toString()} onValueChange={(value) =>
          setGameFormData(prev => ({ ...prev, black_player_id: parseInt(value) }))
        }>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar jugador" />
          </SelectTrigger>
          <SelectContent>
            {getBlackPlayerOptions().map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.full_name} {player.rating && `(${player.rating})`}
                {player.club && ` - ${player.club.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const resultSelect = (
    <div>
      <Label htmlFor="result">Resultado</Label>
      <Select value={gameFormData.result} onValueChange={(value: '1-0' | '0-1' | '1/2-1/2' | '*') =>
        setGameFormData(prev => ({ ...prev, result: value }))
      }>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="*">Sin resultado</SelectItem>
          <SelectItem value="1-0">1-0 (Ganan blancas)</SelectItem>
          <SelectItem value="0-1">0-1 (Ganan negras)</SelectItem>
          <SelectItem value="1/2-1/2">1/2-1/2 (Tablas)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const dateField = (
    <div>
      <Label htmlFor="game_date">Fecha</Label>
      <Input
        type="date"
        value={gameFormData.game_date || ''}
        onChange={(e) => setGameFormData(prev => ({ ...prev, game_date: e.target.value }))}
      />
    </div>
  )

  const timeField = (
    <div>
      <Label htmlFor="game_time">Hora</Label>
      <Input
        type="time"
        value={gameFormData.game_time || ''}
        onChange={(e) => setGameFormData(prev => ({ ...prev, game_time: e.target.value }))}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${mode === 'add' ? 'max-w-lg' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Agregar Nueva Partida' : 'Editar Partida'}</DialogTitle>
        </DialogHeader>

        {mode === 'edit' && !editingGame ? null : (
          <div className="space-y-4 pr-2">
            {mode === 'add' && tournamentType === 'team' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  Información sobre Partidas por Equipos
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  En torneos por equipos, las partidas se organizan por enfrentamientos entre clubes.
                  Cada enfrentamiento puede tener múltiples partidas individuales.
                </p>
              </div>
            )}

            {mode === 'add' && tournamentType === 'team' && (
              <div>
                <Label htmlFor="match">Enfrentamiento *</Label>
                <Select value={gameFormData.match_id?.toString() || ''} onValueChange={(value) => {
                  const matchId = parseInt(value)
                  setGameFormData(prev => ({
                    ...prev,
                    match_id: matchId,
                    white_player_id: 0,
                    black_player_id: 0
                  }))
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar enfrentamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((match) => (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        {match.team_a.name} vs {match.team_b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {matches.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                          No hay enfrentamientos configurados
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Para torneos por equipos, primero debes configurar los enfrentamientos entre clubes
                          al crear la ronda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {colorAssignmentInfo}
              </div>
            )}

            {mode === 'edit' && editingGame && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Partida Original:</p>
                  <p className="font-medium">Blancas: {editingGame.white}</p>
                  {editingGame.whiteRating && (
                    <p className="text-sm text-gray-500">Rating: {editingGame.whiteRating}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium">Negras: {editingGame.black}</p>
                  {editingGame.blackRating && (
                    <p className="text-sm text-gray-500">Rating: {editingGame.blackRating}</p>
                  )}
                </div>
              </div>
            )}

            {mode === 'edit' && tournamentType === 'team' && colorAssignmentInfo}

            {playerSelects}

            {mode === 'add' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="board_number">Número de Mesa</Label>
                  <Input
                    type="number"
                    min="1"
                    value={gameFormData.board_number || ''}
                    onChange={(e) => {
                      const boardNumber = parseInt(e.target.value) || 1
                      setGameFormData(prev => ({
                        ...prev,
                        board_number: boardNumber,
                        // Reset player selections when board changes (affects color assignment)
                        ...(tournamentType === 'team' && prev.match_id && {
                          white_player_id: 0,
                          black_player_id: 0
                        })
                      }))
                    }}
                  />
                </div>

                {resultSelect}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {resultSelect}
                {dateField}
                {timeField}
              </div>
            )}

            {mode === 'add' && (
              <div className="grid grid-cols-2 gap-4">
                {dateField}
                {timeField}
              </div>
            )}

            <div>
              <Label htmlFor="pgn">PGN</Label>
              <Textarea
                placeholder="Notación de la partida..."
                value={gameFormData.pgn || ''}
                onChange={(e) => setGameFormData(prev => ({ ...prev, pgn: e.target.value }))}
                rows={mode === 'add' ? 3 : 4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-950 border-t mt-6 -mx-6 px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={onSubmit}
                disabled={loading || (mode === 'add' && tournamentType === 'team' && matches.length === 0)}
              >
                {loading
                  ? mode === 'add' ? 'Agregando...' : 'Guardando...'
                  : mode === 'add' ? 'Agregar Partida' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
