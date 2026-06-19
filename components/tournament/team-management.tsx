'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useTeamRoster } from '@/hooks/useTeamRoster'
import { RegisteredTeamsSection } from './registered-teams-section'

interface TeamManagementProps {
  tournamentId: string
  tournamentType?: 'individual' | 'team'
  restrictToClubIds?: number[]
}

export default function TeamManagement({ tournamentId, tournamentType = 'individual', restrictToClubIds }: TeamManagementProps) {
  const roster = useTeamRoster({ tournamentId, tournamentType, restrictToClubIds })

  if (tournamentType !== 'team') {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          La gestión de equipos solo está disponible para torneos por equipos.
        </CardContent>
      </Card>
    )
  }

  if (roster.fetchingTeams) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando equipos...</span>
      </div>
    )
  }

  return <RegisteredTeamsSection roster={roster} />
}
