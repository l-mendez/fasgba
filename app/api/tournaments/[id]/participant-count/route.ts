import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournamentId = parseInt(id, 10)
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'individual'

    let participants = 0

    if (type === 'team') {
      const { data: registeredTeams } = await supabase
        .from('tournament_teams')
        .select('team_id, teams(club_id)')
        .eq('tournament_id', tournamentId)

      if (registeredTeams && registeredTeams.length > 0) {
        const clubIds = [...new Set(registeredTeams.map((t: any) => t.teams?.club_id).filter(Boolean))]
        if (clubIds.length > 0) {
          const { data: clubPlayers } = await supabase
            .from('players')
            .select('id')
            .in('club_id', clubIds)
          participants = clubPlayers?.length || 0
        }
      }
    } else {
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', tournamentId)
      participants = registrations?.length || 0
    }

    return apiSuccess({ participants })
  } catch (error) {
    return handleError(error)
  }
}
