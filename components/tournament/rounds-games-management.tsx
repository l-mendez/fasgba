'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Users, User, Calendar, Crown } from 'lucide-react'
import { GameDisplay } from '@/lib/gameUtils-client'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'
import { RoundFormDialog } from './round-form-dialog'
import { GameFormDialog } from './game-form-dialog'
import { MatchFormDialog } from './match-form-dialog'
import { RoundsList } from './rounds-list'
import { MatchesList } from './matches-list'
import { GamesList } from './games-list'
import { GameFormData, Match, Player, Round, Team } from './types'

interface RoundsGamesManagementProps {
  tournamentId: string
  tournamentType: 'individual' | 'team'
  games: GameDisplay[]
  rounds: Round[]
  onGameUpdate?: () => void
}

export default function RoundsGamesManagement({
  tournamentId,
  tournamentType,
  games: initialGames,
  rounds: initialRounds,
  onGameUpdate
}: RoundsGamesManagementProps) {
  // State for games
  const [games, setGames] = useState<GameDisplay[]>(initialGames)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedRound, setSelectedRound] = useState<number>(initialRounds[0]?.id || 0)
  const [isAddGameDialogOpen, setIsAddGameDialogOpen] = useState(false)
  const [isEditGameDialogOpen, setIsEditGameDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<GameDisplay | null>(null)
  const [gameFormData, setGameFormData] = useState<GameFormData>({
    white_player_id: 0,
    black_player_id: 0,
    board_number: 1,
    result: '*',
    pgn: '',
    game_date: '',
    game_time: ''
  })

  // State for rounds
  const [rounds, setRounds] = useState<Round[]>(initialRounds)
  const [teams, setTeams] = useState<Team[]>([])
  const [isAddRoundDialogOpen, setIsAddRoundDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingTeams, setFetchingTeams] = useState(false)

  // State for match management
  const [isEditMatchDialogOpen, setIsEditMatchDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [matchFormData, setMatchFormData] = useState<{
    team_a_id: number
    team_b_id: number
  }>({
    team_a_id: 0,
    team_b_id: 0
  })

  // Game management functions
  const fetchPlayers = async () => {
    try {
      if (tournamentType === 'team') {
        // Only players registered to a team for this tournament are eligible.
        const data = await apiCall(`/api/tournaments/${tournamentId}/players`)
        setPlayers(data.players || [])
      } else {
        const data = await apiCall('/api/players')
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
      toast.error('Error al cargar jugadores')
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
      const response = await apiCall(`/api/tournaments/${tournamentId}/games?type=${tournamentType}`)
      if (response.gamesByRound) {
        const allGames: GameDisplay[] = Object.values(response.gamesByRound).flat() as GameDisplay[]
        setGames(allGames)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    }
  }

  // Round management functions
  const fetchTeams = async () => {
    if (tournamentType !== 'team') return

    try {
      setFetchingTeams(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
      const transformedTeams = data.teams?.map((reg: any) => ({
        id: reg.teams.id,
        name: reg.teams.name
      })) || []
      setTeams(transformedTeams)
    } catch (error) {
      console.error('Error fetching registered teams:', error)
      toast.error('Error al cargar equipos registrados')
    } finally {
      setFetchingTeams(false)
    }
  }

  // Update games when initialGames prop changes
  useEffect(() => {
    setGames(initialGames)
  }, [initialGames])

  // Update rounds when initialRounds prop changes
  useEffect(() => {
    setRounds(initialRounds)
  }, [initialRounds])

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchPlayers()
    if (tournamentType === 'team' && selectedRound) {
      fetchMatches(selectedRound)
    }
  }, [tournamentId, tournamentType, selectedRound])

  useEffect(() => {
    if (tournamentType === 'team') {
      fetchTeams()
    }
  }, [tournamentType])

  const fetchRounds = async () => {
    try {
      const data = await apiCall(`/api/tournaments/${tournamentId}/rounds`)
      const roundsData = data.rounds || []
      setRounds(roundsData)
    } catch (error) {
      console.error('Error fetching rounds:', error)
      toast.error('Error al cargar rondas')
    }
  }

  const handleAddGame = async () => {
    if (!selectedRound || gameFormData.white_player_id === 0 || gameFormData.black_player_id === 0) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (gameFormData.white_player_id === gameFormData.black_player_id) {
      toast.error('Los jugadores blanco y negro deben ser diferentes')
      return
    }

    if (tournamentType === 'team' && !gameFormData.match_id) {
      toast.error('Debe seleccionar un enfrentamiento para torneos por equipos')
      return
    }

    setLoading(true)
    try {
      const gameData = {
        ...gameFormData,
        ...(tournamentType === 'team' && gameFormData.match_id && { match_id: gameFormData.match_id })
      }

      await apiCall(`/api/tournaments/${tournamentId}/rounds/${selectedRound}/games`, {
        method: 'POST',
        body: JSON.stringify(gameData),
      })

      toast.success('Partida agregada exitosamente')
      setIsAddGameDialogOpen(false)
      resetGameForm()

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

    // Validation
    if (gameFormData.white_player_id === 0 || gameFormData.black_player_id === 0) {
      toast.error('Debe seleccionar ambos jugadores')
      return
    }

    if (gameFormData.white_player_id === gameFormData.black_player_id) {
      toast.error('Los jugadores blanco y negro deben ser diferentes')
      return
    }

    // Find the round ID from the round number
    const roundData = rounds.find(r => r.round_number === editingGame.round)
    if (!roundData) {
      toast.error('No se pudo encontrar la ronda para actualizar la partida')
      return
    }

    setLoading(true)
    try {
      const updateData = {
        white_player_id: gameFormData.white_player_id,
        black_player_id: gameFormData.black_player_id,
        result: gameFormData.result,
        pgn: gameFormData.pgn,
        game_date: gameFormData.game_date,
        game_time: gameFormData.game_time
      }

      await apiCall(
        `/api/tournaments/${tournamentId}/rounds/${roundData.id}/games/${editingGame.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }
      )

      toast.success('Partida actualizada exitosamente')
      setIsEditGameDialogOpen(false)
      setEditingGame(null)
      resetGameForm()

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

    // Find the round ID from the round number
    const roundData = rounds.find(r => r.round_number === game.round)
    if (!roundData) {
      toast.error('No se pudo encontrar la ronda para eliminar la partida')
      return
    }

    setLoading(true)
    try {
      await apiCall(
        `/api/tournaments/${tournamentId}/rounds/${roundData.id}/games/${game.id}`,
        {
          method: 'DELETE',
        }
      )

      toast.success('Partida eliminada exitosamente')
      await fetchGames()
      onGameUpdate?.()
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('Error al eliminar partida')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRound = async (roundId: number, roundNumber: number) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la Ronda ${roundNumber}? Esto eliminará todas las partidas de esta ronda.`)) {
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/rounds/${roundId}`, {
        method: 'DELETE',
      })

      toast.success('Ronda eliminada exitosamente')
      await fetchRounds()
    } catch (error) {
      console.error('Error deleting round:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar ronda')
    } finally {
      setLoading(false)
    }
  }

  // Match management functions
  const handleEditMatch = async () => {
    if (!editingMatch) return

    if (matchFormData.team_a_id === 0 || matchFormData.team_b_id === 0) {
      toast.error('Debe seleccionar ambos equipos')
      return
    }

    if (matchFormData.team_a_id === matchFormData.team_b_id) {
      toast.error('Los equipos deben ser diferentes')
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/rounds/${selectedRound}/matches/${editingMatch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          team_a_id: matchFormData.team_a_id,
          team_b_id: matchFormData.team_b_id
        }),
      })

      toast.success('Enfrentamiento actualizado exitosamente. Todas las partidas de este enfrentamiento han sido eliminadas para mantener la coherencia.')
      setIsEditMatchDialogOpen(false)
      setEditingMatch(null)
      resetMatchForm()

      // Refresh data
      await Promise.all([
        fetchMatches(selectedRound),
        fetchGames(),
        fetchRounds()
      ])
      onGameUpdate?.()
    } catch (error) {
      console.error('Error updating match:', error)
      toast.error('Error al actualizar enfrentamiento')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMatch = async (match: Match) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el enfrentamiento ${match.team_a.name} vs ${match.team_b.name}? Esto eliminará todas las partidas de este enfrentamiento.`)) {
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/rounds/${selectedRound}/matches/${match.id}`, {
        method: 'DELETE',
      })

      toast.success('Enfrentamiento eliminado exitosamente')

      // Refresh data
      await Promise.all([
        fetchMatches(selectedRound),
        fetchGames(),
        fetchRounds()
      ])
      onGameUpdate?.()
    } catch (error) {
      console.error('Error deleting match:', error)
      toast.error('Error al eliminar enfrentamiento')
    } finally {
      setLoading(false)
    }
  }

  const openEditMatchDialog = (match: Match) => {
    setEditingMatch(match)
    setMatchFormData({
      team_a_id: match.team_a.id,
      team_b_id: match.team_b.id
    })
    setIsEditMatchDialogOpen(true)
  }

  const resetMatchForm = () => {
    setMatchFormData({
      team_a_id: 0,
      team_b_id: 0
    })
  }

  const openEditGameDialog = (game: GameDisplay) => {
    setEditingGame(game)
    setGameFormData({
      white_player_id: game.whitePlayerId || 0,
      black_player_id: game.blackPlayerId || 0,
      board_number: game.board,
      result: game.result,
      pgn: game.pgn || '',
      game_date: game.date || '',
      game_time: game.time || '',
      match_id: game.matchId || undefined
    })

    setIsEditGameDialogOpen(true)
  }

  const resetGameForm = () => {
    setGameFormData({
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

  const currentRoundGames = games.filter(game => {
    // Find the round from the current tournament that matches the selected round ID
    const selectedRoundData = rounds.find(r => r.id === selectedRound)
    if (!selectedRoundData) {
      return false
    }

    // Only show games that match the round number of the selected round from this tournament
    return game.round === selectedRoundData.round_number
  })

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">Gestión de Rondas y Partidas</h3>
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
      </div>

      {/* Rounds Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-medium">Rondas del Torneo</h4>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {rounds.length} {rounds.length === 1 ? 'ronda' : 'rondas'}
            </Badge>
          </div>

          <Button
            onClick={() => setIsAddRoundDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Ronda
          </Button>

          <RoundFormDialog
            open={isAddRoundDialogOpen}
            onOpenChange={setIsAddRoundDialogOpen}
            tournamentId={tournamentId}
            tournamentType={tournamentType}
            existingRounds={rounds}
            teams={teams}
            fetchingTeams={fetchingTeams}
            onSuccess={fetchRounds}
          />
        </div>

        <RoundsList
          rounds={rounds}
          games={games}
          selectedRound={selectedRound}
          onSelectRound={setSelectedRound}
          loading={loading}
          onDeleteRound={handleDeleteRound}
        />
      </div>

      <Separator />

      {/* Matches Management Section - Only for team tournaments */}
      {tournamentType === 'team' && selectedRound > 0 && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-medium">Enfrentamientos</h4>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Ronda {rounds.find(r => r.id === selectedRound)?.round_number || 'N/A'}
                </Badge>
                <Badge variant="secondary">
                  {matches.length} {matches.length === 1 ? 'enfrentamiento' : 'enfrentamientos'}
                </Badge>
              </div>
            </div>

            <MatchesList
              matches={matches}
              games={games}
              loading={loading}
              onEditMatch={openEditMatchDialog}
              onDeleteMatch={handleDeleteMatch}
            />
          </div>

          <Separator />
        </>
      )}

      {/* Games Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-lg font-medium">Partidas</h4>
            {selectedRound > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Ronda {rounds.find(r => r.id === selectedRound)?.round_number || 'N/A'}
                </Badge>
                <Badge variant="secondary">
                  {currentRoundGames.length} {currentRoundGames.length === 1 ? 'partida' : 'partidas'}
                </Badge>
              </div>
            )}
          </div>

          {selectedRound > 0 && (
            <Button className="flex items-center gap-2" onClick={() => setIsAddGameDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva Partida
            </Button>
          )}
        </div>

        <GamesList
          selectedRound={selectedRound}
          games={currentRoundGames}
          loading={loading}
          onEditGame={openEditGameDialog}
          onDeleteGame={handleDeleteGame}
        />
      </div>

      {/* Add Game Dialog */}
      <GameFormDialog
        mode="add"
        open={isAddGameDialogOpen}
        onOpenChange={setIsAddGameDialogOpen}
        tournamentType={tournamentType}
        gameFormData={gameFormData}
        setGameFormData={setGameFormData}
        matches={matches}
        players={players}
        loading={loading}
        onSubmit={handleAddGame}
      />

      {/* Edit Game Dialog */}
      <GameFormDialog
        mode="edit"
        open={isEditGameDialogOpen}
        onOpenChange={setIsEditGameDialogOpen}
        tournamentType={tournamentType}
        gameFormData={gameFormData}
        setGameFormData={setGameFormData}
        matches={matches}
        players={players}
        editingGame={editingGame}
        loading={loading}
        onSubmit={handleEditGame}
      />

      {/* Edit Match Dialog */}
      <MatchFormDialog
        open={isEditMatchDialogOpen}
        onOpenChange={setIsEditMatchDialogOpen}
        editingMatch={editingMatch}
        teams={teams}
        matchFormData={matchFormData}
        setMatchFormData={setMatchFormData}
        loading={loading}
        onSubmit={handleEditMatch}
        onCancel={() => {
          setIsEditMatchDialogOpen(false)
          setEditingMatch(null)
          resetMatchForm()
        }}
      />
    </div>
  )
}
