'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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

interface RegisteredTeam {
  tournament_id: number
  club_id: number
  clubs: {
    id: number
    name: string
  }
}

interface TeamManagementProps {
  tournamentId: string
  tournamentType?: 'individual' | 'team'
}

export default function TeamManagement({ tournamentId, tournamentType = 'individual' }: TeamManagementProps) {
  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>([])
  const [availableClubs, setAvailableClubs] = useState<Club[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingTeams, setFetchingTeams] = useState(true)
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)

  // Fetch registered teams
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

  // Fetch available clubs
  const fetchAvailableClubs = async () => {
    try {
      const data = await apiCall('/api/clubs')
      setAvailableClubs(data.clubs || [])
    } catch (error) {
      console.error('Error fetching clubs:', error)
      toast.error('Error al cargar clubes')
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (tournamentType === 'team') {
      fetchRegisteredTeams()
      fetchAvailableClubs()
    }
  }, [tournamentId, tournamentType])

  const handleAddTeam = async () => {
    if (!selectedClubId) {
      toast.error('Debe seleccionar un club')
      return
    }

    // Check if team is already registered
    if (registeredTeams.some(team => team.club_id === selectedClubId)) {
      toast.error('Este club ya está registrado en el torneo')
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/registered-teams`, {
        method: 'POST',
        body: JSON.stringify({
          club_id: selectedClubId
        }),
      })

      toast.success('Equipo registrado exitosamente')
      setIsAddDialogOpen(false)
      setSelectedClubId(null)
      
      // Refresh the teams list
      await fetchRegisteredTeams()
    } catch (error) {
      console.error('Error adding team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTeam = async (clubId: number, clubName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${clubName}" del torneo?`)) {
      return
    }

    setLoading(true)
    try {
      await apiCall(`/api/tournaments/${tournamentId}/registered-teams/${clubId}`, {
        method: 'DELETE',
      })

      toast.success('Equipo eliminado exitosamente')
      
      // Refresh the teams list
      await fetchRegisteredTeams()
    } catch (error) {
      console.error('Error removing team:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    } finally {
      setLoading(false)
    }
  }

  // Get available clubs that are not yet registered
  const getAvailableClubs = () => {
    const registeredClubIds = registeredTeams.map(team => team.club_id)
    return availableClubs.filter(club => !registeredClubIds.includes(club.id))
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

  const availableClubsForRegistration = getAvailableClubs()

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
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2"
              disabled={availableClubsForRegistration.length === 0}
            >
              <Plus className="h-4 w-4" />
              Registrar Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Equipo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="club_select">Seleccionar Club</Label>
                <Select
                  value={selectedClubId?.toString() || ''}
                  onValueChange={(value) => setSelectedClubId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClubsForRegistration.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableClubsForRegistration.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Todos los clubes disponibles ya están registrados
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddTeam} 
                  disabled={loading || !selectedClubId}
                >
                  {loading ? 'Registrando...' : 'Registrar Equipo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams List */}
      <div className="grid gap-4">
        {registeredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No hay equipos registrados en este torneo. Registra el primer equipo.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredTeams.map((team) => (
              <Card key={team.club_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{team.clubs.name}</CardTitle>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeam(team.club_id, team.clubs.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">ID del Club:</span>
                    <Badge variant="outline">{team.club_id}</Badge>
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
            Los equipos registrados en este torneo aparecerán aquí. Puedes gestionar los jugadores de cada equipo 
            y ver su información de contacto.
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Los clubes se registran desde su panel de administración</li>
            <li>• Cada club puede registrar jugadores para su equipo</li>
            <li>• Los enfrentamientos se generan automáticamente al crear rondas</li>
          </ul>
        </div>
      )}
    </div>
  )
} 