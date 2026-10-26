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
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Solo disponible para torneos por equipos.
        </CardContent>
      </Card>
    )
  }

  if (roster.fetchingTeams) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <RegisteredTeamsSection roster={roster} />
}
