'use client'

import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Match, Team } from './types'

interface MatchFormData {
  team_a_id: number
  team_b_id: number
}

interface MatchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMatch: Match | null
  teams: Team[]
  matchFormData: MatchFormData
  setMatchFormData: Dispatch<SetStateAction<MatchFormData>>
  loading: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function MatchFormDialog({
  open,
  onOpenChange,
  editingMatch,
  teams,
  matchFormData,
  setMatchFormData,
  loading,
  onSubmit,
  onCancel,
}: MatchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={onSubmit} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
