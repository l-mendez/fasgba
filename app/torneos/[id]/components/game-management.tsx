'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, Users, User, AlertCircle } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'

interface Player {
  id: number
  full_name: string
  fide_id?: string
  rating?: number
  club?: {
    id: number
    name: string
  }
}

interface Match {
  id: number
  club_a: { id: number; name: string }
  club_b: { id: number; name: string }
}

interface Round {
  id: number
  round_number: number
}

interface GameManagementProps {
  tournamentId: string
  tournamentType: 'individual' | 'team'
  games: GameDisplay[]
  rounds: Round[]
  onGameUpdate?: () => void
}

interface GameFormData {
  white_player_id: number
  black_player_id: number
  board_number?: number
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  pgn?: string
  game_date?: string
  game_time?: string
  match_id?: number // For team tournaments
}

export default function GameManagement({ 
  tournamentId, 
  tournamentType, 
  games: initialGames, 
  rounds,
  onGameUpdate 
}: GameManagementProps) {
  const [games, setGames] = useState<GameDisplay[]>(initialGames)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [clubs, setClubs] = useState<{ id: number; name: string }[]>([])
  const [selectedRound, setSelectedRound] = useState<number>(rounds[0]?.id || 0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<GameDisplay | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<GameFormData>({
    white_player_id: 0,
    black_player_id: 0,
    board_number: 1,
    result: '*',
    pgn: '',
    game_date: '',
    game_time: ''
  })

  // Update games when initialGames prop changes
  useEffect(() => {
    setGames(initialGames)
  }, [initialGames])

  // Fetch players and matches when component mounts
  useEffect(() => {
    fetchPlayers()
    if (tournamentType === 'team' && selectedRound) {
      fetchMatches(selectedRound)
    }
  }, [tournamentId, tournamentType, selectedRound])

  // Fetch clubs for team tournaments
  useEffect(() => {
    if (tournamentType === 'team') {
      fetchClubs()
    }
  }, [tournamentType])

  const fetchPlayers = async () => {
    try {
      if (tournamentType === 'team') {
        // For team tournaments, get players from all registered clubs
        const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
        const registeredTeams = data.teams || []
        
        // Fetch all players from registered clubs
        const allPlayers: Player[] = []
        for (const team of registeredTeams) {
          try {
            const clubPlayersData = await apiCall(`/api/clubs/${team.club_id}/players`)
            const clubPlayers = clubPlayersData.players || []
            // Add club info to each player
            const playersWithClub = clubPlayers.map((player: any) => ({
              ...player,
              club: { id: team.club_id, name: team.club_name }
            }))
            allPlayers.push(...playersWithClub)
          } catch (error) {
            console.error(`Error fetching players for club ${team.club_id}:`, error)
          }
        }
        setPlayers(allPlayers)
      } else {
        // For individual tournaments, get all players (they can register individually)
        const data = await apiCall('/api/players')
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
      toast.error('Error al cargar jugadores')
    }
  }

  const fetchClubs = async () => {
    try {
      const data = await apiCall('/api/clubs')
      setClubs(data.clubs || [])
    } catch (error) {
      console.error('Error fetching clubs:', error)
    }
  }

  const fetchMatches = async (roundId: number) => {
    try {
      const data = await apiCall(`/api/tournaments/${tournamentId}/rounds/${roundId}/matches`)
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const fetchGames = async () => {
    try {
      // Fetch games for the tournament
      const response = await apiCall(`/api/tournaments/${tournamentId}/games?type=${tournamentType}`)
      if (response.gamesByRound) {
        // Flatten the games from gamesByRound object into a single array
        const allGames: GameDisplay[] = Object.values(response.gamesByRound).flat() as GameDisplay[]
        setGames(allGames)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    }
  }

  const handleAddGame = async () => {
    if (!selectedRound || formData.white_player_id === 0 || formData.black_player_id === 0) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (formData.white_player_id === formData.black_player_id) {
      toast.error('Los jugadores blanco y negro deben ser diferentes')
      return
    }

    // For team tournaments, match_id is required
    if (tournamentType === 'team' && !formData.match_id) {
      toast.error('Debe seleccionar un enfrentamiento para torneos por equipos')
      return
    }

    setLoading(true)
    try {
      const gameData = {
        ...formData,
        ...(tournamentType === 'team' && formData.match_id && { match_id: formData.match_id })
      }

      await apiCall(`/api/tournaments/${tournamentId}/rounds/${selectedRound}/games`, {
        method: 'POST',
        body: JSON.stringify(gameData),
      })

      toast.success('Partida agregada exitosamente')
      setIsAddDialogOpen(false)
      resetForm()
      
      // Refresh games list immediately
      await fetchGames()
      onGameUpdate?.()
    } catch (error) {
      console.error('Error adding game:', error)
      toast.error('Error al agregar partida')
    } finally {
      setLoading(false)
    }
  }

  const handleEditGame = async () => {
    if (!editingGame) return

    setLoading(true)
    try {
      const updateData = {
        result: formData.result,
        pgn: formData.pgn,
        game_date: formData.game_date,
        game_time: formData.game_time
      }

      await apiCall(
        `/api/tournaments/${tournamentId}/rounds/${editingGame.round}/games/${editingGame.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      )

      toast.success('Partida actualizada exitosamente')
      setIsEditDialogOpen(false)
      setEditingGame(null)
      resetForm()
      
      // Refresh games list immediately
      await fetchGames()
      onGameUpdate?.()
    } catch (error) {
      console.error('Error updating game:', error)
      toast.error('Error al actualizar partida')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGame = async (game: GameDisplay) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
      return
    }

    setLoading(true)
    try {
      await apiCall(
        `/api/tournaments/${tournamentId}/rounds/${game.round}/games/${game.id}`,
        {
          method: 'DELETE',
        }
      )

      toast.success('Partida eliminada exitosamente')
      
      // Refresh games list immediately
      await fetchGames()
      onGameUpdate?.()
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('Error al eliminar partida')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (game: GameDisplay) => {
    setEditingGame(game)
    setFormData({
      white_player_id: 0, // We don't allow changing players in edit
      black_player_id: 0,
      board_number: game.board,
      result: game.result,
      pgn: game.pgn || '',
      game_date: game.date || '',
      game_time: game.time || ''
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      white_player_id: 0,
      black_player_id: 0,
      board_number: 1,
      result: '*',
      pgn: '',
      game_date: '',
      game_time: '',
      match_id: undefined
    })
  }

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case '1-0': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
      case '0-1': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
      case '1/2-1/2': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const currentRoundGames = games.filter(game => {
    const gameRoundId = rounds.find(r => r.round_number === game.round)?.id
    return gameRoundId === selectedRound
  })

  // Handle add match
  const [newMatch, setNewMatch] = useState<{ club_a_id: number; club_b_id: number }>({ club_a_id: 0, club_b_id: 0 })

  const handleAddMatch = async () => {
    if (!selectedRound || newMatch.club_a_id === 0 || newMatch.club_b_id === 0) {
      toast.error('Selecciona ambos clubes')
      return
    }
    if (newMatch.club_a_id === newMatch.club_b_id) {
      toast.error('Los clubes deben ser diferentes')
      return
    }
    setLoading(true)
    try {
      const match = await apiCall(`/api/tournaments/${tournamentId}/rounds/${selectedRound}/matches`, {
        method: 'POST',
        body: JSON.stringify(newMatch)
      })
      toast.success('Enfrentamiento creado')
      setIsAddMatchDialogOpen(false)
      setNewMatch({ club_a_id: 0, club_b_id: 0 })
      // Refresh matches list
      fetchMatches(selectedRound)
      // Auto-select this match in game form
      setFormData(prev => ({ ...prev, match_id: match.id }))
    } catch (error) {
      console.error('Error creando match:', error)
      toast.error('Error al crear enfrentamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Gestión de Partidas</h3>
          {tournamentType === 'team' ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Por Equipos
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Individual
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedRound.toString()} onValueChange={(value) => setSelectedRound(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Seleccionar ronda" />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  Ronda {round.round_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar Partida
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Partida</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Round Information */}
                {tournamentType === 'team' && (
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

                {tournamentType === 'team' && !selectedRound && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        Selecciona una ronda para ver los enfrentamientos disponibles
                      </p>
                    </div>
                  </div>
                )}

                {tournamentType === 'team' && (
                  <div>
                    <Label htmlFor="match">Enfrentamiento *</Label>
                    <Select value={formData.match_id?.toString() || ''} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, match_id: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar enfrentamiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches.map((match) => (
                          <SelectItem key={match.id} value={match.id.toString()}>
                            {match.club_a.name} vs {match.club_b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {matches.length === 0 && (
                      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                              No hay enfrentamientos configurados
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Para torneos por equipos, primero debes configurar los enfrentamientos entre clubes 
                              al crear la ronda en la pestaña "Rondas".
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="white_player">Jugador Blancas *</Label>
                    <Select value={formData.white_player_id.toString()} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, white_player_id: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
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
                    <Select value={formData.black_player_id.toString()} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, black_player_id: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.full_name} {player.rating && `(${player.rating})`}
                            {player.club && ` - ${player.club.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="board_number">Número de Mesa</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.board_number || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        board_number: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="result">Resultado</Label>
                    <Select value={formData.result} onValueChange={(value: '1-0' | '0-1' | '1/2-1/2' | '*') => 
                      setFormData(prev => ({ ...prev, result: value }))
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="game_date">Fecha</Label>
                    <Input
                      type="date"
                      value={formData.game_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, game_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="game_time">Hora</Label>
                    <Input
                      type="time"
                      value={formData.game_time || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, game_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pgn">PGN</Label>
                  <Textarea
                    placeholder="Notación de la partida..."
                    value={formData.pgn || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pgn: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddGame} 
                  disabled={loading || (tournamentType === 'team' && matches.length === 0)}
                >
                  {loading ? 'Agregando...' : 'Agregar Partida'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Games List */}
      <div className="grid gap-4">
        {currentRoundGames.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No hay partidas en esta ronda. Agrega la primera partida.
            </CardContent>
          </Card>
        ) : (
          currentRoundGames.map((game) => (
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
                      onClick={() => openEditDialog(game)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGame(game)}
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
                      <p className="text-sm text-blue-600">{game.whiteTeam}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{game.black}</p>
                    {game.blackRating && (
                      <p className="text-sm text-gray-500">Rating: {game.blackRating}</p>
                    )}
                    {game.blackTeam && (
                      <p className="text-sm text-blue-600">{game.blackTeam}</p>
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
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Partida</DialogTitle>
          </DialogHeader>
          {editingGame && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="result">Resultado</Label>
                  <Select value={formData.result} onValueChange={(value: '1-0' | '0-1' | '1/2-1/2' | '*') => 
                    setFormData(prev => ({ ...prev, result: value }))
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

                <div>
                  <Label htmlFor="game_date">Fecha</Label>
                  <Input
                    type="date"
                    value={formData.game_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, game_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="game_time">Hora</Label>
                  <Input
                    type="time"
                    value={formData.game_time || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, game_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pgn">PGN</Label>
                <Textarea
                  placeholder="Notación de la partida..."
                  value={formData.pgn || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pgn: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditGame} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Match Dialog */}
      {tournamentType === 'team' && (
        <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Enfrentamiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="club_a">Club A</Label>
                  <Select value={newMatch.club_a_id.toString()} onValueChange={(val) => setNewMatch(prev => ({ ...prev, club_a_id: parseInt(val) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar club" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="club_b">Club B</Label>
                  <Select value={newMatch.club_b_id.toString()} onValueChange={(val) => setNewMatch(prev => ({ ...prev, club_b_id: parseInt(val) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar club" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddMatchDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddMatch} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Match'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 