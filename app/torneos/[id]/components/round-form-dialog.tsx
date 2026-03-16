'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'
import { Round, Team } from './types'

interface RoundFormData {
  round_number: number
  matches?: { team_a_id: number; team_b_id: number }[]
}

interface RoundFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  tournamentType: 'individual' | 'team'
  existingRounds: Round[]
  teams: Team[]
  fetchingTeams: boolean
  onSuccess: () => void
}

export function RoundFormDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentType,
  existingRounds,
  teams,
  fetchingTeams,
  onSuccess
}: RoundFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [roundFormData, setRoundFormData] = useState<RoundFormData>({
    round_number: 1,
    matches: []
  })

  // Reset form when dialog opens or rounds change
  useEffect(() => {
    if (open) {
      setRoundFormData({
        round_number: existingRounds.length + 1,
        matches: []
      })
    }
  }, [open, existingRounds.length])

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

  const handleAddRound = async () => {
    if (roundFormData.round_number <= 0) {
      toast.error('El número de ronda debe ser mayor a 0')
      return
    }

    if (existingRounds.some(r => r.round_number === roundFormData.round_number)) {
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
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding round:', error)
      toast.error(error instanceof Error ? error.message : 'Error al agregar ronda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRound} disabled={loading}>
              {loading ? 'Agregando...' : 'Agregar Ronda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
