'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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

export default function ClubEquiposPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params)
  const [club, setClub] = useState<Club | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')

  const fetchClub = async () => {
    try {
      const data = await apiCall(`/api/clubs/${clubId}`)
      setClub(data.club || data)
    } catch {
      toast.error('Error al cargar el club')
    }
  }

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const data = await apiCall(`/api/clubs/${clubId}/teams`)
      setTeams(data.teams || [])
    } catch {
      toast.error('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClub()
    fetchTeams()
  }, [clubId])

  const handleCreate = async () => {
    if (!teamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }

    setSaving(true)
    try {
      await apiCall(`/api/clubs/${clubId}/teams`, {
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
    if (!editingTeam || !teamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }

    setSaving(true)
    try {
      await apiCall(`/api/clubs/${clubId}/teams/${editingTeam.id}`, {
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
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${team.name}"?`)) {
      return
    }

    try {
      await apiCall(`/api/clubs/${clubId}/teams/${team.id}`, {
        method: 'DELETE',
      })
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

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-6">
        <Link href={`/clubes/${clubId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al club
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-terracotta">Equipos</h1>
          {club && <p className="text-muted-foreground">{club.name}</p>}
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
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
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
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
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
