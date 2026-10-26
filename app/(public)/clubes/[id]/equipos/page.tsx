'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, Plus, Pencil, Trash2, Users, Loader2, X } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <>
      <PageHero title="Equipos" subtitle={club?.name} />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6 [&>*]:max-w-3xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href={`/clubes/${clubId}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al club
            </Link>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open)
              if (!open) setTeamName('')
            }}>
              <DialogTrigger asChild>
                <Button className="bg-terracotta text-white hover:bg-terracotta/90">
                  <Plus className="h-4 w-4" />
                  Nuevo equipo
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
                    <Button
                      onClick={handleCreate}
                      disabled={saving || !teamName.trim()}
                      className="bg-terracotta text-white hover:bg-terracotta/90"
                    >
                      {saving ? 'Creando...' : 'Crear'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              Este club no tiene equipos.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {teams.map((team) => (
                <li key={team.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  {editingTeam?.id === team.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        aria-label="Nombre del equipo"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="bg-terracotta text-white hover:bg-terracotta/90"
                        onClick={handleUpdate}
                        disabled={saving || !teamName.trim()}
                        aria-label="Guardar"
                        title="Guardar"
                      >
                        {saving ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button size="icon" variant="outline" onClick={cancelEdit} aria-label="Cancelar" title="Cancelar">
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        <Users className="h-4 w-4 shrink-0 text-amber" />
                        <span className="truncate">{team.name}</span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(team)}
                          aria-label="Editar equipo"
                          title="Editar equipo"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(team)}
                          aria-label="Eliminar equipo"
                          title="Eliminar equipo"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
