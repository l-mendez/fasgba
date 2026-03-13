'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Loader2, UserPlus, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'

interface Club {
  id: number
  name: string
}

interface TeamData {
  id: number
  name: string
  club_id: number
  clubs?: Club
}

interface RegisteredTeam {
  tournament_id: number
  team_id: number
  teams: {
    id: number
    name: string
    club_id: number
    clubs: {
      id: number
      name: string
    }
  }
}

interface TeamPlayer {
  id: number
  full_name: string
  fide_id?: string | null
  rating?: number | null
  team: {
    id: number
    name: string
    clubs?: { id: number; name: string }
  }
  club?: { id: number; name: string }
}

interface SearchPlayer {
  id: number
  full_name: string
  fide_id?: string | null
  rating?: number | null
  club?: { id: number; name: string } | null
}

interface TeamManagementProps {
  tournamentId: string
  tournamentType?: 'individual' | 'team'
  restrictToClubIds?: number[]
}

export default function TeamManagement({ tournamentId, tournamentType = 'individual', restrictToClubIds }: TeamManagementProps) {
  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>([])
  const [availableClubs, setAvailableClubs] = useState<Club[]>([])
  const [clubTeams, setClubTeams] = useState<TeamData[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreateTeamMode, setIsCreateTeamMode] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingTeams, setFetchingTeams] = useState(true)
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [loadingClubTeams, setLoadingClubTeams] = useState(false)

  // Player roster state
  const [teamPlayers, setTeamPlayers] = useState<Record<number, TeamPlayer[]>>({})
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
  const [addPlayerTeamId, setAddPlayerTeamId] = useState<number | null>(null)
  const [playerSearch, setPlayerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([])
  const [searchingPlayers, setSearchingPlayers] = useState(false)
  const [isNewPlayerMode, setIsNewPlayerMode] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerFideId, setNewPlayerFideId] = useState('')
  const [newPlayerRating, setNewPlayerRating] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)

  const fetchRegisteredTeams = async () => {
    try {
      setFetchingTeams(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
      setRegisteredTeams(data.teams || [])
    } catch (error) {
      console.error('Error fetching registered teams:', error)
      toast.error('Error al cargar equipos registrados')
    } finally {
      setFetchingTeams(false)
    }
  }

  const fetchTournamentPlayers = useCallback(async () => {
    try {
      setLoadingPlayers(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/players`)
      const players: TeamPlayer[] = data.players || []
      // Group players by team
      const grouped: Record<number, TeamPlayer[]> = {}
      for (const player of players) {
        const teamId = player.team?.id
        if (teamId) {
          if (!grouped[teamId]) grouped[teamId] = []
          grouped[teamId].push(player)
        }
      }
      setTeamPlayers(grouped)
    } catch (error) {
      console.error('Error fetching tournament players:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }, [tournamentId])

  const fetchAvailableClubs = async () => {
    try {
      const data = await apiCall('/api/clubs')
      let clubs = data.clubs || []
      if (restrictToClubIds) {
        clubs = clubs.filter((c: Club) => restrictToClubIds.includes(c.id))
      }
      setAvailableClubs(clubs)
      if (clubs.length === 1) {
        setSelectedClubId(clubs[0].id)
      }
    } catch (error) {
      console.error('Error fetching clubs:', error)
      toast.error('Error al cargar clubes')
    }
  }

  const fetchClubTeams = async (clubId: number) => {
    try {
      setLoadingClubTeams(true)
      const data = await apiCall(`/api/clubs/${clubId}/teams`)
      setClubTeams(data.teams || [])
    } catch (error) {
      console.error('Error fetching club teams:', error)
      toast.error('Error al cargar equipos del club')
      setClubTeams([])
    } finally {
      setLoadingClubTeams(false)
    }
  }

  useEffect(() => {
    if (tournamentType === 'team') {
      fetchRegisteredTeams()
      fetchAvailableClubs()
      fetchTournamentPlayers()
    }
  }, [tournamentId, tournamentType, fetchTournamentPlayers])

  useEffect(() => {
    if (selectedClubId) {
      fetchClubTeams(selectedClubId)
      setSelectedTeamId(null)
      setIsCreateTeamMode(false)
      setNewTeamName('')
    } else {
      setClubTeams([])
      setSelectedTeamId(null)
    }
  }, [selectedClubId])

  // Debounced player search
  useEffect(() => {
    if (!playerSearch.trim() || playerSearch.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingPlayers(true)
      try {
        const data = await apiCall(`/api/players?search=${encodeURIComponent(playerSearch.trim())}&limit=10`)
        // Filter out players already on this team in this tournament
        const currentTeamPlayers = addPlayerTeamId ? (teamPlayers[addPlayerTeamId] || []) : []
        const currentPlayerIds = currentTeamPlayers.map(p => p.id)
        const filtered = (data.players || []).filter((p: SearchPlayer) => !currentPlayerIds.includes(p.id))
        setSearchResults(filtered)
      } catch (error) {
        console.error('Error searching players:', error)
      } finally {
        setSearchingPlayers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [playerSearch, addPlayerTeamId, teamPlayers])

  const handleCreateTeam = async () => {
    if (!selectedClubId || !newTeamName.trim()) {
      toast.error('Debe ingresar un nombre para el equipo')
      return
    }

    setLoading(true)
    try {
      const team = await apiCall(`/api/clubs/${selectedClubId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name: newTeamName.trim() }),
      })

      toast.success('Equipo creado exitosamente')
      setNewTeamName('')
      setIsCreateTeamMode(false)
      await fetchClubTeams(selectedClubId)
      setSelectedTeamId(team.id)
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeam = async () => {
    if (!selectedTeamId) {
      toast.error('Debe seleccionar un equipo')
      return
    }

    if (registeredTeams.some(t => t.team_id === selectedTeamId)) {
      toast.error('Este equipo ya está registrado en el torneo')
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/registered-teams`, {
        method: 'POST',
        body: JSON.stringify({ team_id: selectedTeamId }),
      })

      toast.success('Equipo registrado exitosamente')
      setIsAddDialogOpen(false)
      setSelectedClubId(null)
      setSelectedTeamId(null)
      setClubTeams([])

      await fetchRegisteredTeams()
    } catch (error) {
      console.error('Error adding team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}" del torneo? También se eliminarán todos sus jugadores registrados.`)) {
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/registered-teams/${teamId}`, {
        method: 'DELETE',
      })

      toast.success('Equipo eliminado exitosamente')
      if (expandedTeamId === teamId) setExpandedTeamId(null)
      await Promise.all([fetchRegisteredTeams(), fetchTournamentPlayers()])
    } catch (error) {
      console.error('Error removing team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExistingPlayer = async (player: SearchPlayer, teamId: number) => {
    setAddingPlayer(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/players`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: player.full_name,
          fide_id: player.fide_id || undefined,
          rating: player.rating || undefined,
          club_id: player.club?.id || undefined,
          team_id: teamId,
        }),
      })

      toast.success(`${player.full_name} agregado al equipo`)
      setPlayerSearch('')
      setSearchResults([])
      await fetchTournamentPlayers()
    } catch (error) {
      console.error('Error adding player:', error)
      toast.error(error instanceof Error ? error.message : 'Error al agregar jugador')
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleAddNewPlayer = async (teamId: number) => {
    if (!newPlayerName.trim()) {
      toast.error('Debe ingresar el nombre del jugador')
      return
    }

    setAddingPlayer(true)
    try {
      // Find the team's club_id
      const team = registeredTeams.find(t => t.team_id === teamId)
      const clubId = team?.teams?.club_id

      await apiCall(`/api/tournaments/${tournamentId}/players`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: newPlayerName.trim(),
          fide_id: newPlayerFideId.trim() || undefined,
          rating: newPlayerRating ? parseInt(newPlayerRating) : undefined,
          club_id: clubId || undefined,
          team_id: teamId,
        }),
      })

      toast.success(`${newPlayerName.trim()} agregado al equipo`)
      setNewPlayerName('')
      setNewPlayerFideId('')
      setNewPlayerRating('')
      setIsNewPlayerMode(false)
      await fetchTournamentPlayers()
    } catch (error) {
      console.error('Error creating player:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear jugador')
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleRemovePlayer = async (playerId: number, playerName: string) => {
    if (!confirm(`¿Eliminar a ${playerName} del torneo?`)) return

    try {
      await apiCall(`/api/tournaments/${tournamentId}/players`, {
        method: 'DELETE',
        body: JSON.stringify({ player_id: playerId }),
      })

      toast.success(`${playerName} eliminado del equipo`)
      await fetchTournamentPlayers()
    } catch (error) {
      console.error('Error removing player:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar jugador')
    }
  }

  const getAvailableTeamsForClub = () => {
    const registeredTeamIds = registeredTeams.map(t => t.team_id)
    return clubTeams.filter(team => !registeredTeamIds.includes(team.id))
  }

  const toggleTeamExpanded = (teamId: number) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
      setAddPlayerTeamId(null)
    } else {
      setExpandedTeamId(teamId)
      setAddPlayerTeamId(null)
    }
    // Reset add player state
    setPlayerSearch('')
    setSearchResults([])
    setIsNewPlayerMode(false)
    setNewPlayerName('')
    setNewPlayerFideId('')
    setNewPlayerRating('')
  }

  const openAddPlayer = (teamId: number) => {
    setAddPlayerTeamId(teamId)
    setPlayerSearch('')
    setSearchResults([])
    setIsNewPlayerMode(false)
    setNewPlayerName('')
    setNewPlayerFideId('')
    setNewPlayerRating('')
  }

  if (tournamentType !== 'team') {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          La gestión de equipos solo está disponible para torneos por equipos.
        </CardContent>
      </Card>
    )
  }

  if (fetchingTeams) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando equipos...</span>
      </div>
    )
  }

  const availableTeamsForClub = getAvailableTeamsForClub()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Equipos Participantes</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {registeredTeams.length} equipos
          </Badge>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setSelectedClubId(null)
            setSelectedTeamId(null)
            setClubTeams([])
            setIsCreateTeamMode(false)
            setNewTeamName('')
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Equipo en Torneo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="club_select">1. Seleccionar Club</Label>
                <Select
                  value={selectedClubId?.toString() || ''}
                  onValueChange={(value) => setSelectedClubId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClubId && (
                <div>
                  <Label htmlFor="team_select">2. Seleccionar Equipo</Label>
                  {loadingClubTeams ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Cargando equipos...</span>
                    </div>
                  ) : isCreateTeamMode ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre del nuevo equipo"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleCreateTeam}
                          disabled={loading || !newTeamName.trim()}
                        >
                          {loading ? 'Creando...' : 'Crear'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsCreateTeamMode(false)
                            setNewTeamName('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedTeamId?.toString() || ''}
                        onValueChange={(value) => setSelectedTeamId(value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeamsForClub.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableTeamsForClub.length === 0 && clubTeams.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Todos los equipos de este club ya están registrados
                        </p>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 p-0 h-auto"
                        onClick={() => setIsCreateTeamMode(true)}
                      >
                        + Crear nuevo equipo
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddTeam}
                  disabled={loading || !selectedTeamId}
                >
                  {loading ? 'Registrando...' : 'Registrar Equipo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {registeredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No hay equipos registrados en este torneo. Registra el primer equipo.
            </CardContent>
          </Card>
        ) : (
          registeredTeams.map((reg) => {
            const players = teamPlayers[reg.team_id] || []
            const isExpanded = expandedTeamId === reg.team_id
            const isAddingToThisTeam = addPlayerTeamId === reg.team_id

            return (
              <Card key={reg.team_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                      onClick={() => toggleTeamExpanded(reg.team_id)}
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{reg.teams.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{reg.teams.clubs.name}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {players.length} jugador{players.length !== 1 ? 'es' : ''}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeam(reg.team_id, reg.teams.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
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
                                onClick={() => handleRemovePlayer(player.id, player.full_name)}
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
                          onClick={() => openAddPlayer(reg.team_id)}
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
                                      onClick={() => handleAddExistingPlayer(player, reg.team_id)}
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
                                  onClick={() => handleAddNewPlayer(reg.team_id)}
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
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {registeredTeams.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Gestión de Equipos</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>- Haz click en un equipo para ver y gestionar sus jugadores</li>
            <li>- Busca jugadores existentes o crea nuevos para agregar al equipo</li>
            <li>- Un jugador puede participar en un solo equipo por torneo</li>
          </ul>
        </div>
      )}
    </div>
  )
}
