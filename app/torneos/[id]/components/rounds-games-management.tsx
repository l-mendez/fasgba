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
import { Separator } from '@/components/ui/separator'
import { Trash2, Edit, Plus, Users, User, AlertCircle, Calendar, Loader2, Trophy, Crown } from 'lucide-react'
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
  team_a: { id: number; name: string }
  team_b: { id: number; name: string }
}

interface Round {
  id: number
  round_number: number
}

interface Team {
  id: number
  name: string
}

interface RoundsGamesManagementProps {
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
  match_id?: number
}

interface RoundFormData {
  round_number: number
  matches?: { team_a_id: number; team_b_id: number }[]
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
  const [clubs, setClubs] = useState<{ id: number; name: string }[]>([])
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
  const [fetchingRounds, setFetchingRounds] = useState(false)
  const [fetchingTeams, setFetchingTeams] = useState(false)
  const [roundFormData, setRoundFormData] = useState<RoundFormData>({
    round_number: 1,
    matches: []
  })

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

  // New state for team-specific players
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([])
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([])

  // Update games when initialGames prop changes
  useEffect(() => {
    setGames(initialGames)
  }, [initialGames])

  // Update rounds when initialRounds prop changes
  useEffect(() => {
    setRounds(initialRounds)
    setRoundFormData(prev => ({ 
      ...prev, 
      round_number: initialRounds.length + 1,
      matches: []
    }))
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
      fetchClubs()
      fetchTeams()
    }
  }, [tournamentType])

  // Game management functions
  const fetchPlayers = async () => {
    try {
      if (tournamentType === 'team') {
        const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
        const registeredTeams = data.teams || []

        const allPlayers: Player[] = []
        const fetchedClubIds = new Set<number>()
        for (const reg of registeredTeams) {
          const clubId = reg.teams?.club_id
          if (!clubId || fetchedClubIds.has(clubId)) continue
          fetchedClubIds.add(clubId)
          try {
            const clubPlayersData = await apiCall(`/api/clubs/${clubId}/players`)
            const clubPlayers = clubPlayersData.players || []
            const playersWithClub = clubPlayers.map((player: any) => ({
              ...player,
              club: { id: clubId, name: reg.teams?.clubs?.name || '' }
            }))
            allPlayers.push(...playersWithClub)
          } catch (error) {
            console.error(`Error fetching players for club ${clubId}:`, error)
          }
        }
        setPlayers(allPlayers)
      } else {
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
      const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
      const registeredTeams = data.teams || []
      const teamsList = registeredTeams.map((reg: any) => ({
        id: reg.teams.id,
        name: reg.teams.name
      }))
      setClubs(teamsList)
    } catch (error) {
      console.error('Error fetching teams:', error)
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

  const fetchRounds = async () => {
    try {
      setFetchingRounds(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/rounds`)
      const roundsData = data.rounds || []
      setRounds(roundsData)
      
      setRoundFormData(prev => ({ 
        ...prev, 
        round_number: roundsData.length + 1,
        matches: []
      }))
    } catch (error) {
      console.error('Error fetching rounds:', error)
      toast.error('Error al cargar rondas')
    } finally {
      setFetchingRounds(false)
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

  const handleAddRound = async () => {
    if (roundFormData.round_number <= 0) {
      toast.error('El número de ronda debe ser mayor a 0')
      return
    }

    if (rounds.some(r => r.round_number === roundFormData.round_number)) {
      toast.error('Ya existe una ronda con ese número')
      return
    }

    if (tournamentType === 'team') {
      if (!roundFormData.matches || roundFormData.matches.length === 0) {
        toast.error('Debe agregar al menos un enfrentamiento para torneos por equipos')
        return
      }

      for (const match of roundFormData.matches) {
        if (match.team_a_id === match.team_b_id) {
          toast.error('Los equipos en un enfrentamiento deben ser diferentes')
          return
        }
      }

      const matchPairs = roundFormData.matches.map(m => 
        [Math.min(m.team_a_id, m.team_b_id), Math.max(m.team_a_id, m.team_b_id)].join('-')
      )
      const uniquePairs = new Set(matchPairs)
      if (matchPairs.length !== uniquePairs.size) {
        toast.error('No puede haber enfrentamientos duplicados')
        return
      }
    }

    setLoading(true)
    try {
      const roundResponse = await apiCall(`/api/tournaments/${tournamentId}/rounds`, {
        method: 'POST',
        body: JSON.stringify({
          round_number: roundFormData.round_number
        }),
      })

      if (tournamentType === 'team' && roundFormData.matches && roundFormData.matches.length > 0) {
        const roundId = roundResponse.id
        
        const matchPromises = roundFormData.matches.map(match => {
          return apiCall(`/api/tournaments/${tournamentId}/rounds/${roundId}/matches`, {
            method: 'POST',
            body: JSON.stringify({
              team_a_id: match.team_a_id,
              team_b_id: match.team_b_id
            })
          })
        })

        await Promise.all(matchPromises)
      }

      toast.success('Ronda agregada exitosamente')
      setIsAddRoundDialogOpen(false)
      
      await fetchRounds()
    } catch (error) {
      console.error('Error adding round:', error)
      toast.error(error instanceof Error ? error.message : 'Error al agregar ronda')
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
    
    // For team tournaments, update team players if we have a match
    if (tournamentType === 'team' && game.matchId) {
      updateTeamPlayersForMatch(game.matchId)
    }
    
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
    // Reset team players when form is reset
    setTeamAPlayers([])
    setTeamBPlayers([])
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
    // Find the round from the current tournament that matches the selected round ID
    const selectedRoundData = rounds.find(r => r.id === selectedRound)
    if (!selectedRoundData) {
      return false
    }
    
    // Only show games that match the round number of the selected round from this tournament
    return game.round === selectedRoundData.round_number
  })

  const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number)

  // Team match management functions
  const addMatch = () => {
    setRoundFormData(prev => ({
      ...prev,
      matches: [...(prev.matches || []), { team_a_id: 0, team_b_id: 0 }]
    }))
  }

  const removeMatch = (index: number) => {
    setRoundFormData(prev => ({
      ...prev,
      matches: prev.matches?.filter((_, i) => i !== index) || []
    }))
  }

  const updateMatch = (index: number, field: 'team_a_id' | 'team_b_id', value: number) => {
    setRoundFormData(prev => ({
      ...prev,
      matches: prev.matches?.map((match, i) => 
        i === index ? { ...match, [field]: value } : match
      ) || []
    }))
  }

  // New functions for team-based player management
  const fetchTeamPlayers = async (clubId: number): Promise<Player[]> => {
    try {
      const clubPlayersData = await apiCall(`/api/clubs/${clubId}/players`)
      const clubPlayers = clubPlayersData.players || []
      return clubPlayers.map((player: any) => ({
        ...player,
        club: { id: clubId, name: clubs.find(c => c.id === clubId)?.name || 'Unknown' }
      }))
    } catch (error) {
      console.error(`Error fetching players for club ${clubId}:`, error)
      return []
    }
  }

  const updateTeamPlayersForMatch = async (matchId: number) => {
    const selectedMatch = matches.find(m => m.id === matchId)
    if (!selectedMatch) {
      setTeamAPlayers([])
      setTeamBPlayers([])
      return
    }

    try {
      const [teamAPlayersData, teamBPlayersData] = await Promise.all([
        fetchTeamPlayers(selectedMatch.team_a.id),
        fetchTeamPlayers(selectedMatch.team_b.id)
      ])
      
      setTeamAPlayers(teamAPlayersData)
      setTeamBPlayers(teamBPlayersData)
    } catch (error) {
      console.error('Error fetching team players:', error)
      setTeamAPlayers([])
      setTeamBPlayers([])
    }
  }

  const getWhitePlayerOptions = (): Player[] => {
    if (tournamentType !== 'team' || !gameFormData.match_id || !gameFormData.board_number) {
      return players
    }

    // Team A plays white on odd boards, Team B plays white on even boards
    const isOddBoard = gameFormData.board_number % 2 === 1
    return isOddBoard ? teamAPlayers : teamBPlayers
  }

  const getBlackPlayerOptions = (): Player[] => {
    if (tournamentType !== 'team' || !gameFormData.match_id || !gameFormData.board_number) {
      return players
    }

    // Team A plays black on even boards, Team B plays black on odd boards
    const isOddBoard = gameFormData.board_number % 2 === 1
    return isOddBoard ? teamBPlayers : teamAPlayers
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
          
          <Dialog open={isAddRoundDialogOpen} onOpenChange={setIsAddRoundDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nueva Ronda
              </Button>
            </DialogTrigger>
            <DialogContent className={tournamentType === 'team' ? "max-w-2xl" : "max-w-md"}>
              <DialogHeader>
                <DialogTitle>
                  Agregar Nueva Ronda
                  {tournamentType === 'team' && ' - Configurar Enfrentamientos'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="round_number">Número de Ronda</Label>
                  <Input
                    id="round_number"
                    type="number"
                    min="1"
                    value={roundFormData.round_number}
                    onChange={(e) => setRoundFormData(prev => ({ 
                      ...prev, 
                      round_number: parseInt(e.target.value) || 1 
                    }))}
                    placeholder="Número de la ronda"
                  />
                </div>

                {tournamentType === 'team' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enfrentamientos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMatch}
                        disabled={fetchingTeams}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Enfrentamiento
                      </Button>
                    </div>

                    {fetchingTeams ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cargando equipos...
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>No hay equipos registrados:</strong> Para crear enfrentamientos, primero deben registrarse equipos en el torneo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {roundFormData.matches?.map((match, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <div className="flex-1">
                              <Select
                                value={match.team_a_id.toString()}
                                onValueChange={(value) => updateMatch(index, 'team_a_id', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Equipo A" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <span className="text-sm font-medium text-gray-500">vs</span>
                            
                            <div className="flex-1">
                              <Select
                                value={match.team_b_id.toString()}
                                onValueChange={(value) => updateMatch(index, 'team_b_id', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Equipo B" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMatch(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )) || []}
                        
                        {(!roundFormData.matches || roundFormData.matches.length === 0) && (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No hay enfrentamientos configurados. Agrega al menos uno.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddRoundDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddRound} disabled={loading}>
                    {loading ? 'Agregando...' : 'Agregar Ronda'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rounds List - Compact Design */}
        {rounds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay rondas creadas</p>
            <p className="text-sm">Agrega la primera ronda para comenzar a organizar las partidas</p>
          </div>
        ) : (
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
                  onClick={() => setSelectedRound(round.id)}
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
                      handleDeleteRound(round.id, round.round_number)
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
        )}
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

            {/* Matches List */}
            {matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No hay enfrentamientos en esta ronda</p>
                <p className="text-sm">Los enfrentamientos se configuran al crear la ronda</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <Card key={match.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {match.team_a.name} vs {match.team_b.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditMatchDialog(match)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMatch(match)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Equipo A: {match.team_a.name}</span>
                        <span>vs</span>
                        <span>Equipo B: {match.team_b.name}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {(() => {
                          const matchGames = games.filter(game => game.matchId === match.id)
                          return `${matchGames.length} ${matchGames.length === 1 ? 'partida' : 'partidas'}`
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
            <Dialog open={isAddGameDialogOpen} onOpenChange={setIsAddGameDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Partida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Partida</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pr-2">
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

                  {tournamentType === 'team' && (
                    <div>
                      <Label htmlFor="match">Enfrentamiento *</Label>
                      <Select value={gameFormData.match_id?.toString() || ''} onValueChange={async (value) => {
                        const matchId = parseInt(value)
                        setGameFormData(prev => ({ 
                          ...prev, 
                          match_id: matchId,
                          white_player_id: 0,
                          black_player_id: 0
                        }))
                        await updateTeamPlayersForMatch(matchId)
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
                      {gameFormData.match_id && (
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
                      )}
                    </div>
                  )}

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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="game_date">Fecha</Label>
                      <Input
                        type="date"
                        value={gameFormData.game_date || ''}
                        onChange={(e) => setGameFormData(prev => ({ ...prev, game_date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="game_time">Hora</Label>
                      <Input
                        type="time"
                        value={gameFormData.game_time || ''}
                        onChange={(e) => setGameFormData(prev => ({ ...prev, game_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pgn">PGN</Label>
                    <Textarea
                      placeholder="Notación de la partida..."
                      value={gameFormData.pgn || ''}
                      onChange={(e) => setGameFormData(prev => ({ ...prev, pgn: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-950 border-t mt-6 -mx-6 px-6 py-4">
                    <Button variant="outline" onClick={() => setIsAddGameDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddGame} 
                      disabled={loading || (tournamentType === 'team' && matches.length === 0)}
                    >
                      {loading ? 'Agregando...' : 'Agregar Partida'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Games List */}
        {selectedRound === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Selecciona una ronda</p>
            <p className="text-sm">Elige una ronda para ver y gestionar sus partidas</p>
          </div>
        ) : currentRoundGames.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay partidas en esta ronda</p>
            <p className="text-sm">Agrega la primera partida para comenzar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {currentRoundGames.map((game) => (
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
                        onClick={() => openEditGameDialog(game)}
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
        )}

        {/* Edit Game Dialog */}
        <Dialog open={isEditGameDialogOpen} onOpenChange={setIsEditGameDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Partida</DialogTitle>
            </DialogHeader>
            {editingGame && (
              <div className="space-y-4 pr-2">
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

                {tournamentType === 'team' && gameFormData.match_id && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
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
                )}

                {/* Player Selection */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_white_player">Jugador Blancas *</Label>
                    <Select 
                      value={gameFormData.white_player_id.toString()} 
                      onValueChange={(value) => 
                        setGameFormData(prev => ({ ...prev, white_player_id: parseInt(value) }))
                      }
                    >
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
                    <Label htmlFor="edit_black_player">Jugador Negras *</Label>
                    <Select 
                      value={gameFormData.black_player_id.toString()} 
                      onValueChange={(value) => 
                        setGameFormData(prev => ({ ...prev, black_player_id: parseInt(value) }))
                      }
                    >
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

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="game_date">Fecha</Label>
                    <Input
                      type="date"
                      value={gameFormData.game_date || ''}
                      onChange={(e) => setGameFormData(prev => ({ ...prev, game_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="game_time">Hora</Label>
                    <Input
                      type="time"
                      value={gameFormData.game_time || ''}
                      onChange={(e) => setGameFormData(prev => ({ ...prev, game_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pgn">PGN</Label>
                  <Textarea
                    placeholder="Notación de la partida..."
                    value={gameFormData.pgn || ''}
                    onChange={(e) => setGameFormData(prev => ({ ...prev, pgn: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-950 border-t mt-6 -mx-6 px-6 py-4">
                  <Button variant="outline" onClick={() => setIsEditGameDialogOpen(false)}>
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

        {/* Edit Match Dialog */}
        <Dialog open={isEditMatchDialogOpen} onOpenChange={setIsEditMatchDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Enfrentamiento</DialogTitle>
            </DialogHeader>
            {editingMatch && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        ⚠️ Advertencia Importante
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Al modificar este enfrentamiento, <strong>todas las partidas</strong> asociadas 
                        a este enfrentamiento serán eliminadas automáticamente para mantener la coherencia 
                        de los datos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enfrentamiento Original:</p>
                  <p className="font-medium">
                    {editingMatch.team_a.name} vs {editingMatch.team_b.name}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_club_a">Equipo A *</Label>
                    <Select 
                      value={matchFormData.team_a_id.toString()} 
                      onValueChange={(value) => 
                        setMatchFormData(prev => ({ ...prev, team_a_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Equipo A" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit_club_b">Equipo B *</Label>
                    <Select 
                      value={matchFormData.team_b_id.toString()} 
                      onValueChange={(value) => 
                        setMatchFormData(prev => ({ ...prev, team_b_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Equipo B" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditMatchDialogOpen(false)
                      setEditingMatch(null)
                      resetMatchForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleEditMatch} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 