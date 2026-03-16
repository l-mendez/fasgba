'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'
import { useClubContext } from '../context/club-context'

interface Team {
  id: number
  name: string
  club_id: number
}

export default function ClubAdminEquiposPage() {
  const { selectedClub, isLoading: clubLoading } = useClubContext()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')

  const fetchTeams = async () => {
    if (!selectedClub) return
    try {
      setLoading(true)
      const data = await apiCall(`/api/clubs/${selectedClub.id}/teams`)
      setTeams(data.teams || [])
    } catch {
      toast.error('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClub) {
      fetchTeams()
    }
  }, [selectedClub?.id])

  const handleCreate = async () => {
    if (!selectedClub || !teamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }
    setSaving(true)
    try {
      await apiCall(`/api/clubs/${selectedClub.id}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name: teamName.trim() }),
      })
      toast.success('Equipo creado exitosamente')
      setTeamName('')
      setIsAddOpen(false)
      await fetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedClub || !editingTeam || !teamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }
    setSaving(true)
    try {
      await apiCall(`/api/clubs/${selectedClub.id}/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: teamName.trim() }),
      })
      toast.success('Equipo actualizado exitosamente')
      setTeamName('')
      setEditingTeam(null)
      await fetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (team: Team) => {
    if (!selectedClub || !confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.name}"?`)) return
    try {
      await apiCall(`/api/clubs/${selectedClub.id}/teams/${team.id}`, { method: 'DELETE' })
      toast.success('Equipo eliminado exitosamente')
      await fetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    }
  }

  const startEdit = (team: Team) => {
    setEditingTeam(team)
    setTeamName(team.name)
  }

  const cancelEdit = () => {
    setEditingTeam(null)
    setTeamName('')
  }

  if (clubLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!selectedClub) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Selecciona un club para gestionar sus equipos.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-terracotta flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Equipos
          </h1>
          <p className="text-muted-foreground">{selectedClub.name}</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) setTeamName('')
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Equipo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team_name">Nombre del equipo</Label>
                <Input
                  id="team_name"
                  placeholder="Ej: Equipo A"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={saving || !teamName.trim()}>
                  {saving ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando equipos...</span>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Este club no tiene equipos creados.</p>
            <p className="text-sm mt-1">Crea un equipo para poder inscribirlo en torneos por equipos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="flex items-center justify-between p-4">
                {editingTeam?.id === team.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleUpdate} disabled={saving || !teamName.trim()}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Cancelar</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(team)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
