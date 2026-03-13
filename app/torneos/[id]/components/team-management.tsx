'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Loader2 } from 'lucide-react'
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

  const fetchAvailableClubs = async () => {
    try {
      const data = await apiCall('/api/clubs')
      let clubs = data.clubs || []
      if (restrictToClubIds) {
        clubs = clubs.filter((c: Club) => restrictToClubIds.includes(c.id))
      }
      setAvailableClubs(clubs)
      // Auto-select if only one club available
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
    }
  }, [tournamentId, tournamentType])

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
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}" del torneo?`)) {
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/registered-teams/${teamId}`, {
        method: 'DELETE',
      })

      toast.success('Equipo eliminado exitosamente')
      await fetchRegisteredTeams()
    } catch (error) {
      console.error('Error removing team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableTeamsForClub = () => {
    const registeredTeamIds = registeredTeams.map(t => t.team_id)
    return clubTeams.filter(team => !registeredTeamIds.includes(team.id))
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

      <div className="grid gap-4">
        {registeredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No hay equipos registrados en este torneo. Registra el primer equipo.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredTeams.map((reg) => (
              <Card key={reg.team_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{reg.teams.name}</CardTitle>
                        <p className="text-sm text-gray-500">{reg.teams.clubs.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeam(reg.team_id, reg.teams.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Club:</span>
                    <Badge variant="outline">{reg.teams.clubs.name}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {registeredTeams.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Gestión de Equipos</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Los equipos registrados en este torneo aparecerán aquí. Un mismo club puede tener múltiples equipos participando.
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Selecciona un club y luego elige o crea un equipo</li>
            <li>• Cada equipo puede registrar jugadores</li>
            <li>• Los enfrentamientos se generan automáticamente al crear rondas</li>
          </ul>
        </div>
      )}
    </div>
  )
}
