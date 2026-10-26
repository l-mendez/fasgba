'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { GameFormData, Match, Player } from './types'
import { PlayerSearchField } from './player-search-field'

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
  // Names of players picked in the search fields, by id (edit mode falls back to the game's names).
  const [pickedNames, setPickedNames] = useState<Record<number, string>>({})
  const getPlayerName = (playerId: number) => {
    if (pickedNames[playerId]) return pickedNames[playerId]
    if (editingGame?.whitePlayerId === playerId) return editingGame.white
    if (editingGame?.blackPlayerId === playerId) return editingGame.black
    return undefined
  }

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
    (() => {
      const matchInfo = getSelectedMatchInfo()
      return matchInfo ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Mesa {gameFormData.board_number || 1}: <strong>{matchInfo.whiteTeam}</strong> con blancas, <strong>{matchInfo.blackTeam}</strong> con negras
        </p>
      ) : null
    })()
  )) || null

  const playerSelect = (color: 'white' | 'black') => {
    const field = color === 'white' ? 'white_player_id' : 'black_player_id'
    const options = color === 'white' ? getWhitePlayerOptions() : getBlackPlayerOptions()
    const inputId = `${color}_player`

    return (
      <div>
        <Label htmlFor={inputId}>{color === 'white' ? 'Blancas *' : 'Negras *'}</Label>
        {tournamentType === 'team' ? (
          // Team games only allow the (few) players registered to each team.
          <Select value={gameFormData[field].toString()} onValueChange={(value) =>
            setGameFormData(prev => ({ ...prev, [field]: parseInt(value) }))
          }>
            <SelectTrigger id={inputId}>
              <SelectValue placeholder="Seleccionar jugador" />
            </SelectTrigger>
            <SelectContent>
              {options.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.full_name} {player.rating && `(${player.rating})`}
                  {player.club && ` - ${player.club.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <PlayerSearchField
            id={inputId}
            value={gameFormData[field]}
            selectedLabel={getPlayerName(gameFormData[field])}
            onSelect={(player) => {
              if (player) setPickedNames(prev => ({ ...prev, [player.id]: player.full_name }))
              setGameFormData(prev => ({ ...prev, [field]: player?.id ?? 0 }))
            }}
          />
        )}
      </div>
    )
  }

  const playerSelects = (
    <div className="space-y-4">
      {playerSelect('white')}
      {playerSelect('black')}
    </div>
  )

  const resultSelect = (
    <div>
      <Label htmlFor="result">Resultado</Label>
      <Select value={gameFormData.result} onValueChange={(value: '1-0' | '0-1' | '1/2-1/2' | '*') =>
        setGameFormData(prev => ({ ...prev, result: value }))
      }>
        <SelectTrigger id="result">
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
        id="game_date"
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
        id="game_time"
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
          <DialogTitle>{mode === 'add' ? 'Nueva partida' : 'Editar partida'}</DialogTitle>
        </DialogHeader>

        {mode === 'edit' && !editingGame ? null : (
          <div className="space-y-4 pr-2">
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
                  <SelectTrigger id="match">
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
                  <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    No hay enfrentamientos. Configúralos al crear la ronda.
                  </p>
                )}
                {colorAssignmentInfo}
              </div>
            )}

            {mode === 'edit' && editingGame && (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{editingGame.white}</p>
                  <p className="text-muted-foreground">Blancas{editingGame.whiteRating ? ` · ${editingGame.whiteRating}` : ''}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{editingGame.black}</p>
                  <p className="text-muted-foreground">Negras{editingGame.blackRating ? ` · ${editingGame.blackRating}` : ''}</p>
                </div>
              </div>
            )}

            {mode === 'edit' && tournamentType === 'team' && colorAssignmentInfo}

            {playerSelects}

            {mode === 'add' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="board_number">Mesa</Label>
                  <Input
                    id="board_number"
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
                id="pgn"
                placeholder="Notación de la partida..."
                value={gameFormData.pgn || ''}
                onChange={(e) => setGameFormData(prev => ({ ...prev, pgn: e.target.value }))}
                rows={mode === 'add' ? 3 : 4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={onSubmit}
                disabled={loading || (mode === 'add' && tournamentType === 'team' && matches.length === 0)}
              >
                {loading
                  ? mode === 'add' ? 'Agregando...' : 'Guardando...'
                  : mode === 'add' ? 'Agregar partida' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
