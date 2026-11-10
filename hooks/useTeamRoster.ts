'use client'

import { useState, useEffect, useCallback, useEffectEvent } from 'react'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'

export interface Club {
  id: number
  name: string
}

export interface TeamData {
  id: number
  name: string
  club_id: number
  clubs?: Club
}

export interface RegisteredTeam {
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

export interface TeamPlayer {
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

export interface SearchPlayer {
  id: number
  full_name: string
  fide_id?: string | null
  rating?: number | null
  club?: { id: number; name: string } | null
}

interface UseTeamRosterOptions {
  tournamentId: string
  tournamentType: 'individual' | 'team'
  restrictToClubIds?: number[]
}

export function useTeamRoster({ tournamentId, tournamentType, restrictToClubIds }: UseTeamRosterOptions) {
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
  const [loadingPlayers, setLoadingPlayers] = useState(tournamentType === 'team')
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

  // load* set state only in promise callbacks, so the mount effect can start
  // them; the fetch* wrappers used by handlers also show the spinner first.
  const loadRegisteredTeams = useCallback(
    () => apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
      .then((data) => setRegisteredTeams(data.teams || []))
      .catch((error) => {
        console.error('Error fetching registered teams:', error)
        toast.error('Error al cargar equipos registrados')
      })
      .finally(() => setFetchingTeams(false)),
    [tournamentId]
  )

  const fetchRegisteredTeams = async () => {
    setFetchingTeams(true)
    await loadRegisteredTeams()
  }

  const loadTournamentPlayers = useCallback(
    () => apiCall(`/api/tournaments/${tournamentId}/players`)
      .then((data) => {
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
      })
      .catch((error) => console.error('Error fetching tournament players:', error))
      .finally(() => setLoadingPlayers(false)),
    [tournamentId]
  )

  const fetchTournamentPlayers = async () => {
    setLoadingPlayers(true)
    await loadTournamentPlayers()
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

  // Picking a club resets the team choice and loads that club's teams
  const selectClub = (clubId: number | null) => {
    if (clubId === selectedClubId) return
    setSelectedClubId(clubId)
    setSelectedTeamId(null)
    if (clubId) {
      setIsCreateTeamMode(false)
      setNewTeamName('')
      fetchClubTeams(clubId)
    } else {
      setClubTeams([])
    }
  }

  // Effect event: reads the latest restrictToClubIds/selection without making
  // the mount effect refetch when the prop array's identity changes.
  const onClubsLoaded = useEffectEvent((allClubs: Club[]) => {
    const clubs = restrictToClubIds
      ? allClubs.filter((c) => restrictToClubIds.includes(c.id))
      : allClubs
    setAvailableClubs(clubs)
    if (clubs.length === 1) {
      selectClub(clubs[0].id)
    }
  })

  useEffect(() => {
    if (tournamentType !== 'team') return

    // Ignore a superseded response so a single club is auto-selected once
    let ignore = false
    loadRegisteredTeams()
    apiCall('/api/clubs')
      .then((data) => {
        if (!ignore) onClubsLoaded(data.clubs || [])
      })
      .catch((error) => {
        console.error('Error fetching clubs:', error)
        toast.error('Error al cargar clubes')
      })
    loadTournamentPlayers()
    return () => {
      ignore = true
    }
  }, [tournamentType, loadRegisteredTeams, loadTournamentPlayers])

  // Queries under 2 characters show no results
  const updatePlayerSearch = (value: string) => {
    setPlayerSearch(value)
    if (value.trim().length < 2) setSearchResults([])
  }

  // Debounced player search
  useEffect(() => {
    if (playerSearch.trim().length < 2) return

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

  return {
    // team registration state
    registeredTeams,
    availableClubs,
    clubTeams,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isCreateTeamMode,
    setIsCreateTeamMode,
    newTeamName,
    setNewTeamName,
    loading,
    fetchingTeams,
    selectedClubId,
    setSelectedClubId: selectClub,
    selectedTeamId,
    setSelectedTeamId,
    loadingClubTeams,
    setClubTeams,
    // player roster state
    teamPlayers,
    loadingPlayers,
    expandedTeamId,
    addPlayerTeamId,
    setAddPlayerTeamId,
    playerSearch,
    setPlayerSearch: updatePlayerSearch,
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
    // actions
    handleCreateTeam,
    handleAddTeam,
    handleRemoveTeam,
    handleAddExistingPlayer,
    handleAddNewPlayer,
    handleRemovePlayer,
    getAvailableTeamsForClub,
    toggleTeamExpanded,
    openAddPlayer,
  }
}
