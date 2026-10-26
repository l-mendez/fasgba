// How each chess-results team and player maps to the site: automatic matching
// plus the admin's choices from the import review. The preview (decide*) and
// the sync (applyAssignments) share these decisions, so what an admin reviews
// is exactly what gets written.

import type { SupabaseClient } from '@supabase/supabase-js'
import { fail } from './db'
import { bestNameMatch, extendsGiven, nameKey, splitName } from './match'
import type { CrTournament } from './types'

/** An existing club, or a new one to create with that name. */
export type ClubRef = { id: number; name: string } | { newName: string }

/** Admin choices from the review, keyed by nameKey() of the chess-results name. */
export type TeamChoice = { teamId: number } | { newTeam: string; club: ClubRef }
export type PlayerChoice = { playerId: number } | { newPlayer: true; club: ClubRef | null }
export interface Assignments {
  teams?: Record<string, TeamChoice>
  players?: Record<string, PlayerChoice>
}

export type TeamDecision =
  | { kind: 'enrolled' | 'existing'; teamId: number; siteName: string; clubName: string | null } // in the tournament / elsewhere on the site
  | { kind: 'new'; name: string; club: ClubRef }
  | { kind: 'unmatched' }

export type PlayerDecision =
  | { kind: 'existing'; playerId: number; siteName: string; clubName: string | null }
  | { kind: 'new'; name: string; fideId: string | null; rating: number | null; club: ClubRef | null }

export interface PlayerInput {
  name: string
  fideId?: string | null
  rating?: number | null
  /** chess-results team, so new players default to the team's club. */
  team?: string | null
}

type SitePlayer = { id: number; full_name: string; fide_id: string | null; club_id: number | null }
type SiteTeam = { id: number; name: string; club_id: number }
export interface SiteData {
  players: SitePlayer[]
  teams: SiteTeam[]
  clubs: Array<{ id: number; name: string }>
  /** Teams already enrolled in the tournament being synced. */
  enrolled: Set<number>
}

export async function loadSiteData(db: SupabaseClient, tournamentId: number | null): Promise<SiteData> {
  const [players, teams, clubs, enrolled] = await Promise.all([
    db.from('players').select('id, full_name, fide_id, club_id').range(0, 9999),
    db.from('teams').select('id, name, club_id').range(0, 9999),
    db.from('clubs').select('id, name').order('name').range(0, 9999),
    tournamentId
      ? db.from('tournament_teams').select('team_id').eq('tournament_id', tournamentId)
      : Promise.resolve({ data: [] as Array<{ team_id: number }>, error: null }),
  ])
  fail('leer jugadores, equipos y clubes', players.error ?? teams.error ?? clubs.error ?? enrolled.error)
  return {
    players: players.data ?? [],
    teams: teams.data ?? [],
    clubs: clubs.data ?? [],
    enrolled: new Set((enrolled.data ?? []).map((r) => r.team_id)),
  }
}

const clubOf = (site: SiteData, id: number | null) => site.clubs.find((c) => c.id === id) ?? null

/** Admin choices first, then exact names in the tournament, then fuzzy, site-wide and by club name. */
export function decideTeams(site: SiteData, names: string[], choices: Assignments['teams'] = {}) {
  const decisions = new Map<string, TeamDecision>()
  const used = new Set<number>()
  const asSite = (t: SiteTeam): TeamDecision => {
    used.add(t.id)
    return { kind: site.enrolled.has(t.id) ? 'enrolled' : 'existing', teamId: t.id, siteName: t.name, clubName: clubOf(site, t.club_id)?.name ?? null }
  }
  const unique = [...new Set(names)]
  for (const name of unique) {
    const choice = choices[nameKey(name)]
    const team = choice && 'teamId' in choice ? site.teams.find((t) => t.id === choice.teamId) : null
    if (team) decisions.set(nameKey(name), asSite(team))
    else if (choice && 'newTeam' in choice) decisions.set(nameKey(name), { kind: 'new', name: choice.newTeam.trim() || name, club: choice.club })
  }
  const inTournament = () => site.teams.filter((t) => site.enrolled.has(t.id) && !used.has(t.id))
  const rest = unique.filter((name) => !decisions.has(nameKey(name)))
  for (const name of rest) {
    const exact = inTournament().find((t) => nameKey(t.name) === nameKey(name))
    if (exact) decisions.set(nameKey(name), asSite(exact))
  }
  for (const name of rest.filter((n) => !decisions.has(nameKey(n)))) {
    const team = bestNameMatch(name, inTournament()) ?? site.teams.find((t) => !used.has(t.id) && nameKey(t.name) === nameKey(name))
    const club = team ? null : bestNameMatch(name, site.clubs)
    decisions.set(nameKey(name), team ? asSite(team) : club ? { kind: 'new', name, club } : { kind: 'unmatched' })
  }
  return decisions
}

/** Existing player by FIDE id, exact name, or a unique "Surname, Given…" extension. */
function playerFinder(site: SiteData) {
  const byFide = new Map<string, SitePlayer>()
  const byName = new Map<string, SitePlayer>()
  const bySurname = new Map<string, Array<{ player: SitePlayer; given: string[] }>>()
  for (const p of site.players) {
    if (p.fide_id) byFide.set(String(p.fide_id), p)
    byName.set(nameKey(p.full_name), p)
    const split = splitName(p.full_name)
    if (split) bySurname.set(split.surname, [...(bySurname.get(split.surname) ?? []), { player: p, given: split.given }])
  }
  return (input: PlayerInput) => {
    const split = splitName(input.name)
    const similar = split ? (bySurname.get(split.surname) ?? []).filter((p) => extendsGiven(p.given, split.given)) : []
    return (input.fideId && byFide.get(input.fideId)) || byName.get(nameKey(input.name)) || (similar.length === 1 ? similar[0].player : undefined)
  }
}

export function decidePlayers(site: SiteData, inputs: PlayerInput[], teams: Map<string, TeamDecision>, choices: Assignments['players'] = {}) {
  const find = playerFinder(site)
  const byId = new Map(site.players.map((p) => [p.id, p]))
  // New players default to their team's club.
  const teamClub = (team?: string | null): ClubRef | null => {
    const d = team ? teams.get(nameKey(team)) : undefined
    if (!d || d.kind === 'unmatched') return null
    if (d.kind === 'new') return d.club
    return clubOf(site, site.teams.find((t) => t.id === d.teamId)?.club_id ?? null)
  }
  const decisions = new Map<string, PlayerDecision>()
  for (const input of inputs) {
    const key = nameKey(input.name)
    if (!key || decisions.has(key)) continue
    const choice = choices[key]
    const found = choice ? ('playerId' in choice ? byId.get(choice.playerId) : undefined) : find(input)
    decisions.set(key, found
      ? { kind: 'existing', playerId: found.id, siteName: found.full_name, clubName: clubOf(site, found.club_id)?.name ?? null }
      : {
        kind: 'new', name: input.name, fideId: input.fideId ?? null, rating: input.rating ?? null,
        club: choice && 'newPlayer' in choice ? choice.club : teamClub(input.team),
      })
  }
  return decisions
}

/** Creates the new clubs, teams and players the decisions call for; returns nameKey → id maps. */
export async function applyAssignments(db: SupabaseClient, site: SiteData, teams: Map<string, TeamDecision>, players: Map<string, PlayerDecision>) {
  const clubIds = new Map(site.clubs.map((c) => [nameKey(c.name), c.id]))
  const refs = [...teams.values(), ...players.values()].flatMap((d) => (d.kind === 'new' && d.club && 'newName' in d.club ? [d.club.newName.trim()] : []))
  const newClubs = [...new Map(refs.filter((n) => n && !clubIds.has(nameKey(n))).map((n) => [nameKey(n), n])).values()]
  if (newClubs.length) {
    const { data, error } = await db.from('clubs').insert(newClubs.map((name) => ({ name }))).select('id, name')
    fail('crear clubes', error)
    for (const c of data ?? []) clubIds.set(nameKey(c.name), c.id)
  }
  const clubId = (club: ClubRef | null) => (!club ? null : 'id' in club ? club.id : clubIds.get(nameKey(club.newName)) ?? null)

  const teamIds = new Map<string, number>()
  let teamsCreated = 0
  for (const [key, d] of teams) {
    if (d.kind === 'enrolled' || d.kind === 'existing') teamIds.set(key, d.teamId)
    if (d.kind !== 'new' || clubId(d.club) == null) continue
    const { data, error } = await db.from('teams').insert({ name: d.name, club_id: clubId(d.club)! }).select('id').single()
    fail('crear equipo', error)
    teamIds.set(key, data!.id)
    teamsCreated++
  }

  const playerIds = new Map<string, number>()
  const toCreate: Array<{ row: { full_name: string; fide_id: string | null; rating: number | null; club_id: number | null } }> = []
  for (const [key, d] of players) {
    if (d.kind === 'existing') playerIds.set(key, d.playerId)
    else toCreate.push({ row: { full_name: d.name, fide_id: d.fideId, rating: d.rating, club_id: clubId(d.club) } })
  }
  if (toCreate.length) {
    const { data, error } = await db.from('players').insert(toCreate.map((p) => p.row)).select('id, full_name')
    fail('crear jugadores', error)
    for (const p of data ?? []) playerIds.set(nameKey(p.full_name), p.id)
  }
  return { teamIds, playerIds, clubsCreated: newClubs.length, teamsCreated, playersCreated: toCreate.length }
}

/** Every chess-results player: listed ones first (they carry FIDE ids and teams), then anyone only seen in games. */
export function crPlayerInputs(cr: CrTournament): PlayerInput[] {
  const listed: PlayerInput[] = cr.details.isTeam
    ? cr.teams.flatMap((t) => t.players.map((p) => ({ ...p, team: t.name })))
    : cr.players
  const refs = cr.rounds.flatMap((r) => [...r.games, ...r.matches.flatMap((m) => m.games)]).flatMap((g) => [g.white, g.black])
  return [...listed, ...refs]
}

export function crTeamNames(cr: CrTournament): string[] {
  return [...cr.teams.map((t) => t.name), ...cr.rounds.flatMap((r) => r.matches.flatMap((m) => [m.home.name, m.away.name]))]
}

/** Team and player decisions for a whole chess-results tournament. */
export function decideAll(site: SiteData, cr: CrTournament, assignments: Assignments = {}) {
  const teams = cr.details.isTeam ? decideTeams(site, crTeamNames(cr), assignments.teams) : new Map<string, TeamDecision>()
  return { teams, players: decidePlayers(site, crPlayerInputs(cr), teams, assignments.players) }
}
