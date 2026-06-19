'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { TeamRosterManagement } from './team-roster-management'
import type { useTeamRoster } from '@/hooks/useTeamRoster'

interface RegisteredTeamsSectionProps {
  roster: ReturnType<typeof useTeamRoster>
}

export function RegisteredTeamsSection({ roster }: RegisteredTeamsSectionProps) {
  const {
    registeredTeams,
    availableClubs,
    clubTeams,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isCreateTeamMode,
    setIsCreateTeamMode,
    newTeamName,
    setNewTeamName,
    loading,
    selectedClubId,
    setSelectedClubId,
    selectedTeamId,
    setSelectedTeamId,
    loadingClubTeams,
    setClubTeams,
    teamPlayers,
    loadingPlayers,
    expandedTeamId,
    addPlayerTeamId,
    setAddPlayerTeamId,
    playerSearch,
    setPlayerSearch,
    searchResults,
    setSearchResults,
    searchingPlayers,
    isNewPlayerMode,
    setIsNewPlayerMode,
    newPlayerName,
    setNewPlayerName,
    newPlayerFideId,
    setNewPlayerFideId,
    newPlayerRating,
    setNewPlayerRating,
    addingPlayer,
    handleCreateTeam,
    handleAddTeam,
    handleRemoveTeam,
    handleAddExistingPlayer,
    handleAddNewPlayer,
    handleRemovePlayer,
    getAvailableTeamsForClub,
    toggleTeamExpanded,
    openAddPlayer,
  } = roster

  const availableTeamsForClub = getAvailableTeamsForClub()

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

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setSelectedClubId(null)
            setSelectedTeamId(null)
            setClubTeams([])
            setIsCreateTeamMode(false)
            setNewTeamName('')
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Equipo en Torneo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="club_select">1. Seleccionar Club</Label>
                <Select
                  value={selectedClubId?.toString() || ''}
                  onValueChange={(value) => setSelectedClubId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClubId && (
                <div>
                  <Label htmlFor="team_select">2. Seleccionar Equipo</Label>
                  {loadingClubTeams ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Cargando equipos...</span>
                    </div>
                  ) : isCreateTeamMode ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre del nuevo equipo"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleCreateTeam}
                          disabled={loading || !newTeamName.trim()}
                        >
                          {loading ? 'Creando...' : 'Crear'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsCreateTeamMode(false)
                            setNewTeamName('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedTeamId?.toString() || ''}
                        onValueChange={(value) => setSelectedTeamId(value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeamsForClub.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableTeamsForClub.length === 0 && clubTeams.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Todos los equipos de este club ya están registrados
                        </p>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 p-0 h-auto"
                        onClick={() => setIsCreateTeamMode(true)}
                      >
                        + Crear nuevo equipo
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddTeam}
                  disabled={loading || !selectedTeamId}
                >
                  {loading ? 'Registrando...' : 'Registrar Equipo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {registeredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No hay equipos registrados en este torneo. Registra el primer equipo.
            </CardContent>
          </Card>
        ) : (
          registeredTeams.map((reg) => {
            const players = teamPlayers[reg.team_id] || []
            const isExpanded = expandedTeamId === reg.team_id
            const isAddingToThisTeam = addPlayerTeamId === reg.team_id

            return (
              <Card key={reg.team_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                      onClick={() => toggleTeamExpanded(reg.team_id)}
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{reg.teams.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{reg.teams.clubs.name}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {players.length} jugador{players.length !== 1 ? 'es' : ''}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeam(reg.team_id, reg.teams.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <TeamRosterManagement
                      teamId={reg.team_id}
                      players={players}
                      loadingPlayers={loadingPlayers}
                      isAddingToThisTeam={isAddingToThisTeam}
                      playerSearch={playerSearch}
                      setPlayerSearch={setPlayerSearch}
                      searchResults={searchResults}
                      setSearchResults={setSearchResults}
                      searchingPlayers={searchingPlayers}
                      isNewPlayerMode={isNewPlayerMode}
                      setIsNewPlayerMode={setIsNewPlayerMode}
                      newPlayerName={newPlayerName}
                      setNewPlayerName={setNewPlayerName}
                      newPlayerFideId={newPlayerFideId}
                      setNewPlayerFideId={setNewPlayerFideId}
                      newPlayerRating={newPlayerRating}
                      setNewPlayerRating={setNewPlayerRating}
                      addingPlayer={addingPlayer}
                      setAddPlayerTeamId={setAddPlayerTeamId}
                      onOpenAddPlayer={openAddPlayer}
                      onAddExistingPlayer={handleAddExistingPlayer}
                      onAddNewPlayer={handleAddNewPlayer}
                      onRemovePlayer={handleRemovePlayer}
                    />
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {registeredTeams.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Gestión de Equipos</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>- Haz click en un equipo para ver y gestionar sus jugadores</li>
            <li>- Busca jugadores existentes o crea nuevos para agregar al equipo</li>
            <li>- Un jugador puede participar en un solo equipo por torneo</li>
          </ul>
        </div>
      )}
    </div>
  )
}
