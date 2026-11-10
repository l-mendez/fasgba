import { createClient } from "@/lib/supabase/server"
import type { DbClient } from "@/lib/tournament/types"
import type { DbRow, PlayerRow } from "@/lib/db-types"

// Game interface for display
export interface GameDisplay {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
  fen?: string
  pgn?: string
  date?: string
  time?: string
  // For team tournaments
  whiteTeam?: string
  blackTeam?: string
  // Player IDs for editing
  whitePlayerId?: number
  blackPlayerId?: number
  matchId?: number
}

type GamePlayer = Pick<PlayerRow, 'id' | 'full_name' | 'rating'> | null

// Columns shared by individual_games and match_games, as selected below.
type GameFields = Pick<DbRow<'individual_games'>, 'id' | 'board_number' | 'result' | 'pgn' | 'fen' | 'game_date' | 'game_time'> & {
  white_player: GamePlayer
  black_player: GamePlayer
}

type TeamInfo = Pick<GameDisplay, 'whiteTeam' | 'blackTeam' | 'matchId'>

// DB nulls become undefined (GameDisplay's optional fields); team fields only for team games.
function toGameDisplay(game: GameFields, round: number | undefined, team?: TeamInfo): GameDisplay {
  return {
    id: game.id,
    round: round || 1,
    white: game.white_player?.full_name || 'Jugador desconocido',
    black: game.black_player?.full_name || 'Jugador desconocido',
    result: game.result as GameDisplay['result'],
    whiteRating: game.white_player?.rating ?? undefined,
    blackRating: game.black_player?.rating ?? undefined,
    board: game.board_number ?? undefined,
    fen: game.fen ?? undefined,
    pgn: game.pgn ?? undefined,
    date: game.game_date ?? undefined,
    time: game.game_time ?? undefined,
    whiteTeam: team?.whiteTeam,
    blackTeam: team?.blackTeam,
    whitePlayerId: game.white_player?.id,
    blackPlayerId: game.black_player?.id,
    matchId: team?.matchId
  }
}

// Fetch games for a tournament
export async function getTournamentGames(tournamentId: number, tournamentType: string = 'individual'): Promise<Record<number, GameDisplay[]>> {
  const supabase: DbClient = await createClient()
  
  try {
    if (tournamentType === 'team') {
      // First, get all rounds for this tournament
      const { data: tournamentRounds, error: roundsError } = await supabase
        .from('rounds')
        .select('id')
        .eq('tournament_id', tournamentId)

      if (roundsError) {
        console.error('Error fetching tournament rounds:', roundsError)
        return {}
      }

      const roundIds = tournamentRounds?.map(r => r.id) || []
      
      if (roundIds.length === 0) {
        return {}
      }

      // Then get matches for these rounds
      const { data: tournamentMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id')
        .in('round_id', roundIds)

      if (matchesError) {
        console.error('Error fetching tournament matches:', matchesError)
        return {}
      }

      const matchIds = tournamentMatches?.map(m => m.id) || []
      
      if (matchIds.length === 0) {
        return {}
      }

      // Finally, fetch team tournament games for these matches
      const { data: matchGames, error } = await supabase
        .from('match_games')
        .select(`
          id,
          board_number,
          result,
          pgn,
          fen,
          game_date,
          game_time,
          white_player:players!match_games_white_player_id_fkey(id, full_name, rating),
          black_player:players!match_games_black_player_id_fkey(id, full_name, rating),
          match:matches!inner(
            id,
            team_a:teams!matches_team_a_id_fkey(id, name, club:clubs(id, name)),
            team_b:teams!matches_team_b_id_fkey(id, name, club:clubs(id, name)),
            round:rounds!inner(id, round_number, tournament_id)
          )
        `)
        .in('match_id', matchIds)

      if (error) {
        console.error('Error fetching team games:', error)
        return {}
      }

      let games: GameDisplay[] = (matchGames || []).map((game) => {
        // In team tournaments, teams alternate colors:
        // Odd boards (1,3,5): Club A plays white, Club B plays black
        // Even boards (2,4,6): Club A plays black, Club B plays white
        const isOddBoard = (game.board_number || 1) % 2 === 1
        const whiteTeam = isOddBoard ? game.match?.team_a?.name : game.match?.team_b?.name
        const blackTeam = isOddBoard ? game.match?.team_b?.name : game.match?.team_a?.name

        return toGameDisplay(game, game.match?.round?.round_number, { whiteTeam, blackTeam, matchId: game.match?.id })
      })

      // Sort games by round then board number
      games = games.sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round
        }
        const boardA = a.board ?? 0
        const boardB = b.board ?? 0
        return boardA - boardB
      })

      // Group by round
      return games.reduce((acc, game) => {
        if (!acc[game.round]) {
          acc[game.round] = []
        }
        acc[game.round].push(game)
        return acc
      }, {} as Record<number, GameDisplay[]>)

    } else {
      // First, get all rounds for this tournament
      const { data: tournamentRounds, error: roundsError } = await supabase
        .from('rounds')
        .select('id')
        .eq('tournament_id', tournamentId)

      if (roundsError) {
        console.error('Error fetching tournament rounds:', roundsError)
        return {}
      }

      const roundIds = tournamentRounds?.map(r => r.id) || []
      
      if (roundIds.length === 0) {
        return {}
      }

      // Fetch individual tournament games for these rounds
      const { data: individualGames, error } = await supabase
        .from('individual_games')
        .select(`
          id,
          board_number,
          result,
          pgn,
          fen,
          game_date,
          game_time,
          white_player:players!individual_games_white_player_id_fkey(id, full_name, rating),
          black_player:players!individual_games_black_player_id_fkey(id, full_name, rating),
          round:rounds(id, round_number)
        `)
        .in('round_id', roundIds)

      if (error) {
        console.error('Error fetching individual games:', error)
        return {}
      }

      let games: GameDisplay[] = (individualGames || []).map((game) => toGameDisplay(game, game.round?.round_number))

      // Sort games by round then board number
      games = games.sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round
        }
        const boardA = a.board ?? 0
        const boardB = b.board ?? 0
        return boardA - boardB
      })

      // Group by round
      return games.reduce((acc, game) => {
        if (!acc[game.round]) {
          acc[game.round] = []
        }
        acc[game.round].push(game)
        return acc
      }, {} as Record<number, GameDisplay[]>)
    }
  } catch (error) {
    console.error('Error fetching tournament games:', error)
    return {}
  }
}

// Fetch a specific game by ID
export async function getGameById(gameId: number, tournamentType: string = 'individual'): Promise<GameDisplay | null> {
  const supabase: DbClient = await createClient()
  
  try {
    if (tournamentType === 'team') {
      // Fetch from match_games
      const { data: matchGame, error } = await supabase
        .from('match_games')
        .select(`
          id,
          board_number,
          result,
          pgn,
          fen,
          game_date,
          game_time,
          white_player:players!match_games_white_player_id_fkey(id, full_name, rating),
          black_player:players!match_games_black_player_id_fkey(id, full_name, rating),
          match:matches(
            id,
            team_a:teams!matches_team_a_id_fkey(id, name, club:clubs(id, name)),
            team_b:teams!matches_team_b_id_fkey(id, name, club:clubs(id, name)),
            round:rounds(id, round_number)
          )
        `)
        .eq('id', gameId)
        .single()

      if (error || !matchGame) {
        console.error('Error fetching team game:', error)
        return null
      }

      // In team tournaments, teams alternate colors:
      // Odd boards (1,3,5): Club A plays white, Club B plays black
      // Even boards (2,4,6): Club A plays black, Club B plays white
      const isOddBoard = (matchGame.board_number || 1) % 2 === 1
      const whiteTeam = isOddBoard ? matchGame.match?.team_a?.name : matchGame.match?.team_b?.name
      const blackTeam = isOddBoard ? matchGame.match?.team_b?.name : matchGame.match?.team_a?.name

      return toGameDisplay(matchGame, matchGame.match?.round?.round_number, { whiteTeam, blackTeam, matchId: matchGame.match?.id })

    } else {
      // Fetch from individual_games
      const { data: individualGame, error } = await supabase
        .from('individual_games')
        .select(`
          id,
          board_number,
          result,
          pgn,
          fen,
          game_date,
          game_time,
          white_player:players!individual_games_white_player_id_fkey(id, full_name, rating),
          black_player:players!individual_games_black_player_id_fkey(id, full_name, rating),
          round:rounds(id, round_number)
        `)
        .eq('id', gameId)
        .single()

      if (error || !individualGame) {
        console.error('Error fetching individual game:', error)
        return null
      }

      return toGameDisplay(individualGame, individualGame.round?.round_number)
    }
  } catch (error) {
    console.error('Error fetching game by ID:', error)
    return null
  }
}

// Get total rounds for a tournament from the database
export async function getTournamentRounds(tournamentId: number): Promise<number> {
  const supabase: DbClient = await createClient()
  
  try {
    const { data: rounds, error } = await supabase
      .from('rounds')
      .select('round_number')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: false })
      .limit(1)

    if (error || !rounds || rounds.length === 0) {
      // Fallback to tournament.rounds field
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('rounds')
        .eq('id', tournamentId)
        .single()
      
      return tournament?.rounds || 0
    }

    return rounds[0].round_number
  } catch (error) {
    console.error('Error fetching tournament rounds:', error)
    return 0 // Unknown: never invent a round count
  }
} 