import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { getTournamentParticipantCount } from '@/lib/tournamentUtils'

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

    const participants = await getTournamentParticipantCount(supabase, tournamentId, type)

    return apiSuccess({ participants })
  } catch (error) {
    return handleError(error)
  }
}
