// Team-tournament half of the chess-results sync: teams, rosters, matches
// and board games. Teams are matched by name; unknown teams are created under
// the club whose name they contain, or reported in `unmatchedTeams`.

import type { SupabaseClient } from '@supabase/supabase-js'
import { bestNameMatch, nameKey, resolvePlayers } from './match'
import { applyResultUpdates, ensureRounds, fail, planGames } from './db'
import type { CrTournament } from './types'

export interface TeamSyncCounts {
  playersCreated: number
  teamsLinked: number
  teamsCreated: number
  roundsCreated: number
  matchesCreated: number
  gamesCreated: number
  resultsUpdated: number
  unmatchedTeams: string[]
}

async function resolveTeams(db: SupabaseClient, tournamentId: number, names: string[]) {
  const [linked, all, clubs] = await Promise.all([
    db.from('tournament_teams').select('team_id, teams(id, name)').eq('tournament_id', tournamentId),
    db.from('teams').select('id, name').range(0, 9999),
    db.from('clubs').select('id, name').range(0, 9999),
  ])
  fail('leer equipos', linked.error ?? all.error ?? clubs.error)
  const inTournament = (linked.data ?? [])
    .map((row) => row.teams as unknown as { id: number; name: string } | null)
    .filter((t): t is { id: number; name: string } => !!t)
  const global = new Map((all.data ?? []).map((t) => [nameKey(t.name), t.id]))

  // Exact names first, so fuzzy matching only sees the leftovers on both sides.
  const ids = new Map<string, number>()
  const pending: string[] = []
  for (const name of new Set(names)) {
    const exact = inTournament.find((t) => nameKey(t.name) === nameKey(name))
    if (exact) ids.set(nameKey(name), exact.id)
    else pending.push(name)
  }
  const toLink: number[] = []
  const unmatched: string[] = []
  let teamsCreated = 0
  for (const name of pending) {
    const free = inTournament.filter((t) => ![...ids.values()].includes(t.id))
    let id = bestNameMatch(name, free)?.id ?? global.get(nameKey(name))
    if (!id) {
      const club = bestNameMatch(name, clubs.data ?? [])
      if (!club) { unmatched.push(name); continue }
      const { data, error } = await db.from('teams').insert({ name, club_id: club.id }).select('id').single()
      fail('crear equipo', error)
      id = data!.id as number
      teamsCreated++
    }
    ids.set(nameKey(name), id)
    if (!inTournament.some((t) => t.id === id)) toLink.push(id)
  }
  if (toLink.length) {
    const rows = [...new Set(toLink)].map((team_id) => ({ tournament_id: tournamentId, team_id }))
    fail('inscribir equipos', (await db.from('tournament_teams').insert(rows)).error)
  }
  return { ids, teamsLinked: new Set(toLink).size, teamsCreated, unmatched }
}

export async function syncTeams(db: SupabaseClient, tournamentId: number, cr: CrTournament): Promise<TeamSyncCounts> {
  const teamNames = [...cr.teams.map((t) => t.name), ...cr.rounds.flatMap((r) => r.matches.flatMap((m) => [m.home.name, m.away.name]))]
  const teams = await resolveTeams(db, tournamentId, teamNames)
  const teamId = (name: string) => teams.ids.get(nameKey(name)) ?? null

  const refs = cr.rounds.flatMap((r) => r.matches.flatMap((m) => m.games.flatMap((g) => [g.white, g.black])))
  const { ids: players, created: playersCreated } = await resolvePlayers(db, [...cr.teams.flatMap((t) => t.players), ...refs])
  const playerId = (name: string) => players.get(nameKey(name)) ?? null

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
      const { data: games, error: gamesError } = await db.from('match_games').select('id, board_number, result').eq('match_id', matchId)
      fail('leer partidas', gamesError)
      const plan = planGames(match.games, new Map((games ?? []).map((g) => [String(g.board_number), g])),
        (g) => String(g.board),
        (g) => ({ match_id: matchId, board_number: g.board, white_player_id: playerId(g.white.name), black_player_id: playerId(g.black.name), result: g.result, game_date: round.date }))
      if (plan.inserts.length) fail('crear partidas', (await db.from('match_games').insert(plan.inserts)).error)
      await applyResultUpdates(db, 'match_games', plan.updates)
      gamesCreated += plan.inserts.length
      resultsUpdated += plan.updates.length
    }
  }
  return {
    playersCreated, teamsLinked: teams.teamsLinked, teamsCreated: teams.teamsCreated, roundsCreated: rounds.created,
    matchesCreated, gamesCreated, resultsUpdated, unmatchedTeams: teams.unmatched,
  }
}
