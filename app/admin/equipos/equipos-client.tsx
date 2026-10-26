'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Loader2, Search } from 'lucide-react'
import { AdminConfirmDialog } from '@/components/admin-confirm-dialog'
import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminRowActions } from '@/components/admin-row-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { InfoPill } from "@/components/info-pill"
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

interface CreateTeamDialogProps {
  clubs: Club[]
  handleCreate: () => void
  isAddOpen: boolean
  newTeamClubId: string
  saving: boolean
  setIsAddOpen: (open: boolean) => void
  setNewTeamClubId: (clubId: string) => void
  setTeamName: (name: string) => void
  teamName: string
}

function CreateTeamDialog({
  clubs,
  handleCreate,
  isAddOpen,
  newTeamClubId,
  saving,
  setIsAddOpen,
  setNewTeamClubId,
  setTeamName,
  teamName,
}: CreateTeamDialogProps) {
  return (
    <Dialog open={isAddOpen} onOpenChange={(open) => {
      setIsAddOpen(open)
      if (!open) { setTeamName(''); setNewTeamClubId('') }
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo equipo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo equipo</DialogTitle>
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
            <Label htmlFor="new_team_name">Nombre del equipo</Label>
            <Input
              id="new_team_name"
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
  )
}

interface AdminEquiposClientProps {
  initialClubs: Club[]
  initialTeamsByClub: Record<number, Team[]>
}

export function AdminEquiposClient({
  initialClubs,
  initialTeamsByClub,
}: AdminEquiposClientProps) {
  const [clubs] = useState<Club[]>(initialClubs)
  const [teamsByClub, setTeamsByClub] = useState<Record<number, Team[]>>(initialTeamsByClub)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [editClubId, setEditClubId] = useState<string>('')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [newTeamClubId, setNewTeamClubId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      toast.success('Equipo creado')
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
    if (!editingTeam || !teamName.trim() || !editClubId) {
      toast.error('Completa todos los campos')
      return
    }
    setSaving(true)
    try {
      const newClubId = parseInt(editClubId, 10)
      const body: Record<string, unknown> = { name: teamName.trim() }
      if (newClubId !== editingTeam.club_id) {
        body.club_id = newClubId
      }
      await apiCall(`/api/clubs/${editingTeam.club_id}/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      toast.success('Equipo actualizado')
      closeEditDialog()
      await fetchAllTeams(clubs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!teamToDelete) return
    setDeleting(true)
    try {
      await apiCall(`/api/clubs/${teamToDelete.club_id}/teams/${teamToDelete.id}`, { method: 'DELETE' })
      toast.success('Equipo eliminado')
      setTeamToDelete(null)
      await fetchAllTeams(clubs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setTeamName(team.name)
    setEditClubId(team.club_id.toString())
    setIsEditOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditOpen(false)
    setEditingTeam(null)
    setTeamName('')
    setEditClubId('')
  }

  const getClubName = (clubId: number) => clubs.find(c => c.id === clubId)?.name || ''

  // Filter clubs and teams
  const filteredClubs = clubs.filter((club) => {
    if (selectedClubId && selectedClubId !== 'all' && club.id.toString() !== selectedClubId) return false
    const clubTeams = teamsByClub[club.id] || []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return club.name.toLowerCase().includes(q) || clubTeams.some(t => t.name.toLowerCase().includes(q))
    }
    return clubTeams.length > 0 || selectedClubId === club.id.toString()
  })

  const totalTeams = Object.values(teamsByClub).flat().length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Equipos"
        subtitle={`${totalTeams} ${totalTeams === 1 ? 'equipo' : 'equipos'} en ${clubs.length} ${clubs.length === 1 ? 'club' : 'clubes'}`}
        action={
          <CreateTeamDialog
            clubs={clubs}
            isAddOpen={isAddOpen}
            newTeamClubId={newTeamClubId}
            saving={saving}
            setIsAddOpen={setIsAddOpen}
            setNewTeamClubId={setNewTeamClubId}
            setTeamName={setTeamName}
            teamName={teamName}
            handleCreate={handleCreate}
          />
        }
      />

      <AdminConfirmDialog
        open={teamToDelete !== null}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title="¿Eliminar equipo?"
        description={teamToDelete ? `Se eliminará "${teamToDelete.name}". Esta acción no se puede deshacer.` : undefined}
        onConfirm={handleDelete}
        pending={deleting}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) closeEditDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_team_name">Nombre del equipo</Label>
              <Input
                id="edit_team_name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              />
            </div>
            <div>
              <Label>Club</Label>
              <Select value={editClubId} onValueChange={setEditClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingTeam && editClubId && parseInt(editClubId, 10) !== editingTeam.club_id && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Se moverá de &quot;{getClubName(editingTeam.club_id)}&quot; a &quot;{getClubName(parseInt(editClubId, 10))}&quot;
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditDialog}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={saving || !teamName.trim() || !editClubId}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <Loader2 className="h-6 w-6 animate-spin text-terracotta" aria-label="Cargando" />
        </div>
      ) : filteredClubs.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No se encontraron equipos</p>
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
                  <h2 className="text-lg font-semibold text-terracotta">{club.name}</h2>
                  <InfoPill icon={Users}>{clubTeams.length} {clubTeams.length === 1 ? 'equipo' : 'equipos'}</InfoPill>
                </div>
                {clubTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-1">Sin equipos</p>
                ) : (
                  <div className="space-y-2">
                    {clubTeams.map((team) => (
                      <Card key={team.id}>
                        <CardContent className="flex items-center justify-between gap-3 px-4 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Users className="h-4 w-4 shrink-0 text-amber" />
                            <span className="truncate font-medium">{team.name}</span>
                          </div>
                          <AdminRowActions
                            actions={[
                              { label: 'Editar', icon: Pencil, onSelect: () => openEditDialog(team) },
                              { label: 'Eliminar', icon: Trash2, destructive: true, onSelect: () => setTeamToDelete(team) },
                            ]}
                          />
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
