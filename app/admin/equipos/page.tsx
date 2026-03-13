'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users, Loader2, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiCall } from '@/lib/utils/apiClient'

interface Team {
  id: number
  name: string
  club_id: number
}

interface Club {
  id: number
  name: string
}

export default function AdminEquiposPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [teamsByClub, setTeamsByClub] = useState<Record<number, Team[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [newTeamClubId, setNewTeamClubId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchClubs = async () => {
    try {
      const data = await apiCall('/api/clubs')
      setClubs(data.clubs || [])
    } catch {
      toast.error('Error al cargar clubes')
    }
  }

  const fetchAllTeams = async (clubList: Club[]) => {
    try {
      setLoading(true)
      const results: Record<number, Team[]> = {}
      await Promise.all(
        clubList.map(async (club) => {
          try {
            const data = await apiCall(`/api/clubs/${club.id}/teams`)
            results[club.id] = data.teams || []
          } catch {
            results[club.id] = []
          }
        })
      )
      setTeamsByClub(results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const data = await apiCall('/api/clubs').catch(() => ({ clubs: [] }))
      const clubList = data.clubs || []
      setClubs(clubList)
      await fetchAllTeams(clubList)
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!newTeamClubId || !teamName.trim()) {
      toast.error('Selecciona un club e ingresa un nombre')
      return
    }
    setSaving(true)
    try {
      await apiCall(`/api/clubs/${newTeamClubId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name: teamName.trim() }),
      })
      toast.success('Equipo creado exitosamente')
      setTeamName('')
      setNewTeamClubId('')
      setIsAddOpen(false)
      await fetchAllTeams(clubs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingTeam || !teamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }
    setSaving(true)
    try {
      await apiCall(`/api/clubs/${editingTeam.club_id}/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: teamName.trim() }),
      })
      toast.success('Equipo actualizado exitosamente')
      setTeamName('')
      setEditingTeam(null)
      await fetchAllTeams(clubs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.name}"?`)) return
    try {
      await apiCall(`/api/clubs/${team.club_id}/teams/${team.id}`, { method: 'DELETE' })
      toast.success('Equipo eliminado exitosamente')
      await fetchAllTeams(clubs)
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

  // Filter clubs and teams
  const filteredClubs = clubs.filter((club) => {
    if (selectedClubId && selectedClubId !== 'all' && club.id.toString() !== selectedClubId) return false
    const clubTeams = teamsByClub[club.id] || []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const clubMatch = club.name.toLowerCase().includes(q)
      const teamMatch = clubTeams.some(t => t.name.toLowerCase().includes(q))
      return clubMatch || teamMatch
    }
    return clubTeams.length > 0 || selectedClubId === club.id.toString()
  })

  const totalTeams = Object.values(teamsByClub).flat().length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-terracotta flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Equipos
          </h1>
          <p className="text-muted-foreground">{totalTeams} equipo{totalTeams !== 1 ? 's' : ''} en {clubs.length} clubes</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) { setTeamName(''); setNewTeamClubId('') }
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
                <Label>Club</Label>
                <Select value={newTeamClubId} onValueChange={setNewTeamClubId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Button onClick={handleCreate} disabled={saving || !teamName.trim() || !newTeamClubId}>
                  {saving ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por club o equipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedClubId} onValueChange={setSelectedClubId}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder="Todos los clubes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clubes</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando equipos...</span>
        </div>
      ) : filteredClubs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron equipos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredClubs.map((club) => {
            const clubTeams = (teamsByClub[club.id] || []).filter(t =>
              !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || club.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            if (clubTeams.length === 0 && selectedClubId !== club.id.toString()) return null

            return (
              <div key={club.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold">{club.name}</h2>
                  <Badge variant="outline">{clubTeams.length} equipo{clubTeams.length !== 1 ? 's' : ''}</Badge>
                </div>
                {clubTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-1">Sin equipos</p>
                ) : (
                  <div className="space-y-2">
                    {clubTeams.map((team) => (
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
          })}
        </div>
      )}
    </div>
  )
}
