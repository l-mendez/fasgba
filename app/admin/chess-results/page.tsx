import { AdminPageHeader } from "@/components/admin-page-header"
import { ErrorAlert } from "@/components/error-alert"
import { ChessResultsImportButton } from "@/components/chess-results/chess-results-import-button"
import { createAdminClient } from "@/lib/supabase/admin"
import { CandidatesClient } from "./candidates-client"
import { RunDiscoveryButton } from "./run-discovery-button"
import type { CandidateItem, CandidateStatus, TournamentOption } from "./types"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Torneos de chess-results | Admin FASGBA",
}

async function loadData(): Promise<{ candidates: CandidateItem[]; tournaments: TournamentOption[] }> {
  const db = createAdminClient()
  const [candidates, tournaments] = await Promise.all([
    db.from("chess_results_candidates")
      .select(`tnr, name, start_date, end_date, organizer, place, time_control, rounds, players, status,
        suggested:tournaments!chess_results_candidates_suggested_tournament_id_fkey(id, title),
        tournament:tournaments!chess_results_candidates_tournament_id_fkey(id, title)`)
      .order("start_date", { ascending: false, nullsFirst: false }),
    db.from("tournaments").select("id, title, chess_results_tnr, tournamentdates(event_date)").order("id", { ascending: false }),
  ])
  if (candidates.error) throw new Error(`Error al leer los torneos detectados: ${candidates.error.message}`)
  if (tournaments.error) throw new Error(`Error al leer los torneos: ${tournaments.error.message}`)

  return {
    candidates: (candidates.data ?? []).map((c) => ({
      ...c,
      status: c.status as CandidateStatus,
      suggested: (c.suggested as unknown as CandidateItem["suggested"]) ?? null,
      tournament: (c.tournament as unknown as CandidateItem["tournament"]) ?? null,
    })),
    tournaments: (tournaments.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      tnr: t.chess_results_tnr,
      startDate: (t.tournamentdates ?? []).map((d: { event_date: string }) => d.event_date).sort()[0] ?? null,
    })),
  }
}

export default async function AdminChessResultsPage() {
  let data: Awaited<ReturnType<typeof loadData>> | null = null
  let error: string | null = null
  try {
    data = await loadData()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los torneos detectados"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Torneos de chess-results"
        subtitle="Torneos detectados cada semana en chess-results. Importalos, vinculalos a un torneo existente o ignoralos."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <ChessResultsImportButton chooseClub />
            <RunDiscoveryButton />
          </div>
        }
      />
      {error && <ErrorAlert message={error} />}
      {data && <CandidatesClient candidates={data.candidates} tournaments={data.tournaments} />}
    </div>
  )
}
