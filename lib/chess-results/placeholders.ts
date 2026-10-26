// chess-results lists empty team boards as a player called "Sin jugador
// asignado"; the sync would create it as a real player. Drop it from rosters
// and blank it in games, so those boards are imported without that player.

import type { CrGame, CrTournament } from './types'

const PLACEHOLDER = /^sin jugador asignado$/i

const isPlaceholder = (name: string) => PLACEHOLDER.test(name.trim())
const blank = <T extends { name: string }>(ref: T): T => (isPlaceholder(ref.name) ? { ...ref, name: '' } : ref)
const cleanGame = (game: CrGame): CrGame => ({ ...game, white: blank(game.white), black: blank(game.black) })

export function withoutPlaceholderPlayers(cr: CrTournament): CrTournament {
  return {
    ...cr,
    players: cr.players.filter((p) => !isPlaceholder(p.name)),
    teams: cr.teams.map((t) => ({ ...t, players: t.players.filter((p) => !isPlaceholder(p.name)) })),
    rounds: cr.rounds.map((r) => ({
      ...r,
      games: r.games.map(cleanGame),
      matches: r.matches.map((m) => ({ ...m, games: m.games.map(cleanGame) })),
    })),
  }
}
