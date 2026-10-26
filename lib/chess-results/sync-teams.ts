// Team-tournament half of the chess-results sync: enrolment, rosters, matches
// and board games. Teams and players are already resolved (see assign.ts);
// teams that couldn't be resolved are reported in `unmatchedTeams`.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TeamDecision } from './assign'
import { nameKey } from './match'
import { applyGameUpdates, ensureRounds, fail, planGames } from './db'
import type { CrTournament } from './types'

export interface TeamSyncCounts {
  teamsLinked: number
  roundsCreated: number
  matchesCreated: number
  gamesCreated: number
  resultsUpdated: number
  pgnsAdded: number
  unmatchedTeams: string[]
}

export async function syncTeams(
  db: SupabaseClient,
  tournamentId: number,
  cr: CrTournament,
  decisions: Map<string, TeamDecision>,
  ids: { teamIds: Map<string, number>; playerIds: Map<string, number> },
): Promise<TeamSyncCounts> {
  const teamId = (name: string) => ids.teamIds.get(nameKey(name)) ?? null
  const playerId = (name: string) => ids.playerIds.get(nameKey(name)) ?? null

  // Enroll every resolved team that isn't in the tournament yet.
  const toLink = [...new Set([...decisions].filter(([, d]) => d.kind !== 'enrolled').map(([key]) => ids.teamIds.get(key)))]
    .filter((id): id is number => id != null)
  if (toLink.length) {
    fail('inscribir equipos', (await db.from('tournament_teams').insert(toLink.map((team_id) => ({ tournament_id: tournamentId, team_id })))).error)
  }
  const unmatched = [...new Set([...cr.teams.map((t) => t.name), ...cr.rounds.flatMap((r) => r.matches.flatMap((m) => [m.home.name, m.away.name]))])]
    .filter((name) => teamId(name) == null)

  // Rosters
  const { data: roster, error } = await db.from('tournament_team_players').select('player_id').eq('tournament_id', tournamentId)
  fail('leer planteles', error)
  const rostered = new Set((roster ?? []).map((r) => r.player_id))
  const rosterRows = cr.teams.flatMap((t) => t.players.map((p) => ({ tournament_id: tournamentId, team_id: teamId(t.name), player_id: playerId(p.name) })))
    .filter((r): r is { tournament_id: number; team_id: number; player_id: number } => !!r.team_id && !!r.player_id && !rostered.has(r.player_id))
  const uniqueRoster = [...new Map(rosterRows.map((r) => [r.player_id, r])).values()]
  if (uniqueRoster.length) fail('crear planteles', (await db.from('tournament_team_players').insert(uniqueRoster)).error)

  const played = cr.rounds.filter((r) => r.matches.length)
  const rounds = await ensureRounds(db, tournamentId, played.map((r) => r.number))
  let matchesCreated = 0
  let gamesCreated = 0
  let resultsUpdated = 0
  let pgnsAdded = 0
  for (const round of played) {
    const roundId = rounds.ids.get(round.number)!
    const { data: matches, error: matchError } = await db.from('matches').select('id, team_a_id, team_b_id').eq('round_id', roundId)
    fail('leer encuentros', matchError)
    const pairKey = (a: number, b: number) => [a, b].sort((x, y) => x - y).join(':')
    const matchIds = new Map((matches ?? []).map((m) => [pairKey(m.team_a_id!, m.team_b_id!), m.id]))

    for (const match of round.matches) {
      const home = teamId(match.home.name)
      const away = teamId(match.away.name)
      if (!home || !away) continue
      let matchId = matchIds.get(pairKey(home, away))
      if (!matchId) {
        const { data, error: insertError } = await db.from('matches').insert({ round_id: roundId, team_a_id: home, team_b_id: away }).select('id').single()
        fail('crear encuentro', insertError)
        matchId = data!.id as number
        matchesCreated++
      }
      const { data: games, error: gamesError } = await db.from('match_games').select('id, board_number, result, pgn').eq('match_id', matchId)
      fail('leer partidas', gamesError)
      const plan = planGames(match.games, new Map((games ?? []).map((g) => [String(g.board_number), g])),
        (g) => String(g.board),
        (g) => ({ match_id: matchId, board_number: g.board, white_player_id: playerId(g.white.name), black_player_id: playerId(g.black.name), result: g.result, game_date: round.date }))
      if (plan.inserts.length) fail('crear partidas', (await db.from('match_games').insert(plan.inserts)).error)
      await applyGameUpdates(db, 'match_games', plan.updates)
      gamesCreated += plan.inserts.length
      resultsUpdated += plan.resultsUpdated
      pgnsAdded += plan.pgnsAdded
    }
  }
  return {
    teamsLinked: toLink.length, roundsCreated: rounds.created,
    matchesCreated, gamesCreated, resultsUpdated, pgnsAdded, unmatchedTeams: unmatched,
  }
}
