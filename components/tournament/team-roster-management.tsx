'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, UserPlus, X, Search } from 'lucide-react'
import type { TeamPlayer, SearchPlayer } from '@/hooks/useTeamRoster'

interface TeamRosterManagementProps {
  teamId: number
  players: TeamPlayer[]
  loadingPlayers: boolean
  isAddingToThisTeam: boolean
  playerSearch: string
  setPlayerSearch: (value: string) => void
  searchResults: SearchPlayer[]
  setSearchResults: (results: SearchPlayer[]) => void
  searchingPlayers: boolean
  isNewPlayerMode: boolean
  setIsNewPlayerMode: (value: boolean) => void
  newPlayerName: string
  setNewPlayerName: (value: string) => void
  newPlayerFideId: string
  setNewPlayerFideId: (value: string) => void
  newPlayerRating: string
  setNewPlayerRating: (value: string) => void
  addingPlayer: boolean
  setAddPlayerTeamId: (teamId: number | null) => void
  onOpenAddPlayer: (teamId: number) => void
  onAddExistingPlayer: (player: SearchPlayer, teamId: number) => void
  onAddNewPlayer: (teamId: number) => void
  onRemovePlayer: (playerId: number, playerName: string) => void
}

export function TeamRosterManagement({
  teamId,
  players,
  loadingPlayers,
  isAddingToThisTeam,
  playerSearch,
  setPlayerSearch,
  searchResults,
  setSearchResults,
  searchingPlayers,
  isNewPlayerMode,
  setIsNewPlayerMode,
  newPlayerName,
  setNewPlayerName,
  newPlayerFideId,
  setNewPlayerFideId,
  newPlayerRating,
  setNewPlayerRating,
  addingPlayer,
  setAddPlayerTeamId,
  onOpenAddPlayer,
  onAddExistingPlayer,
  onAddNewPlayer,
  onRemovePlayer,
}: TeamRosterManagementProps) {
  return (
    <div className="border-t pt-4 space-y-3">
      {/* Player list */}
      {loadingPlayers ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando jugadores...</span>
        </div>
      ) : players.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No hay jugadores registrados en este equipo.
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-muted-foreground w-6 text-right shrink-0">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{player.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {player.rating && <span>ELO: {player.rating}</span>}
                    {player.fide_id && <span>FIDE: {player.fide_id}</span>}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemovePlayer(player.id, player.full_name)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 h-8 w-8 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add player section */}
      {!isAddingToThisTeam ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => onOpenAddPlayer(teamId)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Jugador
        </Button>
      ) : (
        <div className="border rounded-lg p-3 mt-2 space-y-3 bg-background">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Agregar jugador al equipo</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setAddPlayerTeamId(null)
                setIsNewPlayerMode(false)
                setPlayerSearch('')
                setSearchResults([])
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {!isNewPlayerMode ? (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jugador por nombre..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {searchingPlayers && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Buscando...</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                      onClick={() => onAddExistingPlayer(player, teamId)}
                      disabled={addingPlayer}
                    >
                      <p className="text-sm font-medium">{player.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {player.rating && <span>ELO: {player.rating}</span>}
                        {player.fide_id && <span>FIDE: {player.fide_id}</span>}
                        {player.club && <span>{player.club.name}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {playerSearch.trim().length >= 2 && !searchingPlayers && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No se encontraron jugadores.
                </p>
              )}

              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={() => {
                  setIsNewPlayerMode(true)
                  setNewPlayerName(playerSearch.trim())
                }}
              >
                + Crear nuevo jugador
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre completo *</Label>
                <Input
                  placeholder="Nombre del jugador"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">FIDE ID</Label>
                  <Input
                    placeholder="Opcional"
                    value={newPlayerFideId}
                    onChange={(e) => setNewPlayerFideId(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">ELO</Label>
                  <Input
                    type="number"
                    placeholder="Opcional"
                    value={newPlayerRating}
                    onChange={(e) => setNewPlayerRating(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onAddNewPlayer(teamId)}
                  disabled={addingPlayer || !newPlayerName.trim()}
                >
                  {addingPlayer ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Agregando...
                    </>
                  ) : (
                    'Agregar'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsNewPlayerMode(false)
                    setNewPlayerName('')
                    setNewPlayerFideId('')
                    setNewPlayerRating('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
