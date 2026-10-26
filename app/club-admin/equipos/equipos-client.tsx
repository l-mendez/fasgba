'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Pencil, Trash2, Users, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/components/admin-confirm-dialog'
import { AdminPageHeader } from '@/components/admin-page-header'
import { apiCall } from '@/lib/utils/apiClient'
import { useClubContext } from '../context/club-context'
import type { ClubAdminTeam } from '@/lib/club-admin/types'

interface ClubAdminEquiposProps {
  initialClubId: number
  initialTeams: ClubAdminTeam[]
}

interface CreateTeamDialogProps {
  handleCreate: () => void
  isAddOpen: boolean
  saving: boolean
  setIsAddOpen: (open: boolean) => void
  setTeamName: (name: string) => void
  teamName: string
}

function CreateTeamDialog({
  handleCreate,
  isAddOpen,
  saving,
  setIsAddOpen,
  setTeamName,
  teamName,
}: CreateTeamDialogProps) {
  return (
    <Dialog open={isAddOpen} onOpenChange={(open) => {
      setIsAddOpen(open)
      if (!open) setTeamName('')
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo equipo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear equipo</DialogTitle>
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
  )
}

export function ClubAdminEquipos({
  initialClubId,
  initialTeams,
}: ClubAdminEquiposProps) {
  const { selectedClub } = useClubContext()
  const [teams, setTeams] = useState<ClubAdminTeam[]>(initialTeams)
  const [loading, setLoading] = useState(false)
  const [currentClubId, setCurrentClubId] = useState(initialClubId)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<ClubAdminTeam | null>(null)
  const [teamName, setTeamName] = useState('')
  const [teamToDelete, setTeamToDelete] = useState<ClubAdminTeam | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTeams = async () => {
    if (!selectedClub) return
    try {
      setLoading(true)
      const data = await apiCall(`/api/clubs/${selectedClub.id}/teams`)
      setTeams(data.teams || [])
      setCurrentClubId(selectedClub.id)
    } catch {
      toast.error('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClub && selectedClub.id !== currentClubId) {
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
      toast.success('Equipo creado')
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
      toast.success('Equipo actualizado')
      setTeamName('')
      setEditingTeam(null)
      await fetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedClub || !teamToDelete) return
    setDeleting(true)
    try {
      await apiCall(`/api/clubs/${selectedClub.id}/teams/${teamToDelete.id}`, { method: 'DELETE' })
      toast.success('Equipo eliminado')
      await fetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar equipo')
    } finally {
      setDeleting(false)
      setTeamToDelete(null)
    }
  }

  const startEdit = (team: ClubAdminTeam) => {
    setEditingTeam(team)
    setTeamName(team.name)
  }

  const cancelEdit = () => {
    setEditingTeam(null)
    setTeamName('')
  }

  const createDialog = (
    <CreateTeamDialog
      handleCreate={handleCreate}
      isAddOpen={isAddOpen}
      saving={saving}
      setIsAddOpen={setIsAddOpen}
      setTeamName={setTeamName}
      teamName={teamName}
    />
  )

  if (!selectedClub) {
    return (
      <>
        <AdminPageHeader title="Equipos" />
        <p className="p-12 text-center text-muted-foreground">Selecciona un club.</p>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Equipos" action={createDialog} />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay equipos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                {editingTeam?.id === team.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      aria-label="Nombre del equipo"
                      className="mr-1"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit} aria-label="Cancelar" title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleUpdate}
                      disabled={saving || !teamName.trim()}
                      aria-label="Guardar"
                      title="Guardar"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-amber" />
                      <span className="truncate font-medium">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(team)} aria-label="Editar" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTeamToDelete(team)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Eliminar"
                        title="Eliminar"
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

      <AdminConfirmDialog
        open={teamToDelete !== null}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title={`¿Eliminar ${teamToDelete?.name ?? 'equipo'}?`}
        onConfirm={handleDelete}
        pending={deleting}
      />
    </div>
  )
}
