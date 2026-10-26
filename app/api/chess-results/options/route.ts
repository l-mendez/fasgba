import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chessResultsErrorResponse, requireTournamentManager } from '@/lib/tournament/chess-results'
import type { ChessResultsOptions } from '@/lib/tournament/chess-results-dto'
import { apiSuccess } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

/** GET /api/chess-results/options: site teams, clubs and players for the import review pickers. */
export async function GET(request: NextRequest) {
  try {
    await requireTournamentManager(request)
    const db = createAdminClient()
    const [teams, clubs, players] = await Promise.all([
      db.from('teams').select('id, name, clubs(name)').order('name').range(0, 9999),
      db.from('clubs').select('id, name').order('name').range(0, 9999),
      db.from('players').select('id, full_name, fide_id, clubs(name)').order('full_name').range(0, 9999),
    ])
    const error = teams.error ?? clubs.error ?? players.error
    if (error) throw new Error(`Error al leer equipos, clubes y jugadores: ${error.message}`)
    const clubName = (row: { clubs: unknown }) => (row.clubs as { name: string } | null)?.name ?? null
    const options: ChessResultsOptions = {
      teams: (teams.data ?? []).map((t) => ({ id: t.id, name: t.name, clubName: clubName(t) })),
      clubs: clubs.data ?? [],
      players: (players.data ?? []).map((p) => ({ id: p.id, name: p.full_name, fideId: p.fide_id, clubName: clubName(p) })),
    }
    return apiSuccess(options)
  } catch (error) {
    return chessResultsErrorResponse(error)
  }
}
