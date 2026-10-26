'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { InfoPill } from '@/components/info-pill'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Calendar, Loader2, Users, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'

interface Round {
  id: number
  round_number: number
}

interface Team {
  id: number
  name: string
}

interface Match {
  id: number
  team_a: { id: number; name: string }
  team_b: { id: number; name: string }
}

interface RoundManagementProps {
  tournamentId: string
  tournamentType?: 'individual' | 'team'
}

interface RoundFormData {
  round_number: number
  matches?: { team_a_id: number; team_b_id: number }[]
}

export default function RoundManagement({ tournamentId, tournamentType = 'individual' }: RoundManagementProps) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingRounds, setFetchingRounds] = useState(true)
  const [fetchingTeams, setFetchingTeams] = useState(false)
  const [formData, setFormData] = useState<RoundFormData>({
    round_number: 1,
    matches: []
  })

  // Fetch rounds data
  const fetchRounds = async () => {
    try {
      setFetchingRounds(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/rounds`)
      const roundsData = data.rounds || []
      setRounds(roundsData)
      
      // Update form data with next round number
      setFormData(prev => ({ 
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

  // Fetch teams data for team tournaments
  const fetchTeams = async () => {
    if (tournamentType !== 'team') return
    
    try {
      setFetchingTeams(true)
      const data = await apiCall(`/api/tournaments/${tournamentId}/registered-teams`)
      // Transform the data to match the expected Team interface
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

  // Load rounds and teams on component mount
  useEffect(() => {
    fetchRounds()
    fetchTeams()
  }, [tournamentId, tournamentType])

  const handleAddRound = async () => {
    if (formData.round_number <= 0) {
      toast.error('El número de ronda debe ser mayor a 0')
      return
    }

    // Check if round number already exists
    if (rounds.some(r => r.round_number === formData.round_number)) {
      toast.error('Ya existe una ronda con ese número')
      return
    }

    // For team tournaments, validate matches
    if (tournamentType === 'team') {
      if (!formData.matches || formData.matches.length === 0) {
        toast.error('Debe agregar al menos un enfrentamiento para torneos por equipos')
        return
      }

      // Validate that all matches have different teams
      for (const match of formData.matches) {
        if (match.team_a_id === match.team_b_id) {
          toast.error('Los equipos en un enfrentamiento deben ser diferentes')
          return
        }
      }

      // Check for duplicate matches
      const matchPairs = formData.matches.map(m => 
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
      // First create the round
      const roundResponse = await apiCall(`/api/tournaments/${tournamentId}/rounds`, {
        method: 'POST',
        body: JSON.stringify({
          round_number: formData.round_number
        }),
      })

      // For team tournaments, create the matches
      if (tournamentType === 'team' && formData.matches && formData.matches.length > 0) {
        const roundId = roundResponse.id
        
        // Create all matches for this round
        const matchPromises = formData.matches.map(match => {
          return apiCall(`/api/tournaments/${tournamentId}/rounds/${roundId}/matches`, {
            method: 'POST',
            body: JSON.stringify({
              team_a_id: match.team_a_id,
              team_b_id: match.team_b_id
            })
          })
        })

        const matchResults = await Promise.all(matchPromises)
      }

      toast.success('Ronda agregada exitosamente')
      setIsAddDialogOpen(false)
      
      // Refresh the rounds list
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
      
      // Refresh the rounds list
      await fetchRounds()
    } catch (error) {
      console.error('Error deleting round:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar ronda')
    } finally {
      setLoading(false)
    }
  }

  // Team match management functions
  const addMatch = () => {
    setFormData(prev => ({
      ...prev,
      matches: [...(prev.matches || []), { team_a_id: 0, team_b_id: 0 }]
    }))
  }

  const removeMatch = (index: number) => {
    setFormData(prev => ({
      ...prev,
      matches: prev.matches?.filter((_, i) => i !== index) || []
    }))
  }

  const updateMatch = (index: number, field: 'team_a_id' | 'team_b_id', value: number) => {
    setFormData(prev => ({
      ...prev,
      matches: prev.matches?.map((match, i) => 
        i === index ? { ...match, [field]: value } : match
      ) || []
    }))
  }

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.name : 'Seleccionar equipo'
  }

  if (fetchingRounds) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando rondas...</span>
      </div>
    )
  }

  const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tight text-terracotta">Rondas</h3>
          <InfoPill icon={tournamentType === 'team' ? Users : Trophy}>
            {tournamentType === 'team' ? 'Por Equipos' : 'Individual'}
          </InfoPill>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Ronda
            </Button>
          </DialogTrigger>
          <DialogContent className={tournamentType === 'team' ? "max-w-2xl" : "max-w-md"}>
            <DialogHeader>
              <DialogTitle>Agregar Ronda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="round_number">Número de Ronda</Label>
                <Input
                  id="round_number"
                  type="number"
                  min="1"
                  value={formData.round_number}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    round_number: parseInt(e.target.value) || 1 
                  }))}
                  placeholder="Número de la ronda"
                />
              </div>

              {/* Team Match Setup for Team Tournaments */}
              {tournamentType === 'team' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enfrentamientos</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMatch}
                      disabled={fetchingTeams || teams.length < 2}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {fetchingTeams ? (
                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cargando equipos...
                    </div>
                  ) : teams.length < 2 ? (
                    <p className="text-sm text-muted-foreground">Se necesitan al menos 2 equipos registrados.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {formData.matches?.map((match, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-md bg-muted p-2">
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
                          
                          <span className="text-sm font-medium text-muted-foreground">vs</span>
                          
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
                            variant="ghost"
                            size="icon"
                            aria-label="Quitar enfrentamiento"
                            title="Quitar enfrentamiento"
                            onClick={() => removeMatch(index)}
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )) || []}
                      
                      {(!formData.matches || formData.matches.length === 0) && (
                        <p className="p-4 text-center text-sm text-muted-foreground">Agrega al menos un enfrentamiento.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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

      {/* Rounds List */}
      <div className="grid gap-4">
        {rounds.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay rondas creadas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedRounds.map((round) => (
              <Card key={round.id} className="flex items-center gap-3 p-4">
                <Calendar className="h-4 w-4 text-amber" />
                <p className="flex-1 font-medium">Ronda {round.round_number}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar ronda ${round.round_number}`}
                  title="Eliminar ronda"
                  onClick={() => handleDeleteRound(round.id, round.round_number)}
                  disabled={loading}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 