// @ts-nocheck
/* eslint-disable */

import { createClient } from "@/lib/supabase/server"

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

// Raw database interfaces
interface Player {
  id: number
  full_name: string
  rating?: number
}

interface Club {
  id: number
  name: string
}

interface Round {
  id: number
  round_number: number
}

interface IndividualGameRaw {
  id: number
  board_number?: number
  result: string
  pgn?: string
  fen?: string
  game_date?: string
  game_time?: string
  white_player: Player
  black_player: Player
  round: Round
}

interface MatchGameRaw {
  id: number
  board_number: number
  result: string
  pgn?: string
  fen?: string
  game_date?: string
  game_time?: string
  white_player: Player
  black_player: Player
  match: {
    id: number
    club_a: Club
    club_b: Club
    round: Round
  }
}

// Fetch games for a tournament
export async function getTournamentGames(tournamentId: number, tournamentType: string = 'individual'): Promise<Record<number, GameDisplay[]>> {
  const supabase = await createClient()
  
  try {
    if (tournamentType === 'team') {
      // Fetch team tournament games
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
          match:matches(
            id,
            club_a:clubs!matches_club_a_id_fkey(id, name),
            club_b:clubs!matches_club_b_id_fkey(id, name),
            round:rounds(id, round_number)
          )
        `)
        .eq('match.round.tournament_id', tournamentId)

      if (error) {
        console.error('Error fetching team games:', error)
        return {}
      }

      const matchGamesArray: any[] = (matchGames || []) as any[]

      let games: GameDisplay[] = matchGamesArray.map((game: any) => {
        // In team tournaments, teams alternate colors:
        // Odd boards (1,3,5): Club A plays white, Club B plays black
        // Even boards (2,4,6): Club A plays black, Club B plays white
        const isOddBoard = (game.board_number || 1) % 2 === 1
        const whiteTeam = isOddBoard ? game.match?.club_a?.name : game.match?.club_b?.name
        const blackTeam = isOddBoard ? game.match?.club_b?.name : game.match?.club_a?.name
        
        return {
          id: game.id,
          round: game.match?.round?.round_number || 1,
          white: game.white_player?.full_name || 'Jugador desconocido',
          black: game.black_player?.full_name || 'Jugador desconocido',
          result: game.result as '1-0' | '0-1' | '1/2-1/2' | '*',
          whiteRating: game.white_player?.rating,
          blackRating: game.black_player?.rating,
          board: game.board_number,
          fen: game.fen,
          pgn: game.pgn,
          date: game.game_date,
          time: game.game_time,
          whiteTeam,
          blackTeam,
          whitePlayerId: game.white_player?.id,
          blackPlayerId: game.black_player?.id,
          matchId: game.match?.id
        }
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
      // Fetch individual tournament games
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
        .eq('round.tournament_id', tournamentId)

      if (error) {
        console.error('Error fetching individual games:', error)
        return {}
      }

      const individualGamesArray: any[] = (individualGames || []) as any[]

      let games: GameDisplay[] = individualGamesArray.map((game: any) => ({
        id: game.id,
        round: game.round?.round_number || 1,
        white: game.white_player?.full_name || 'Jugador desconocido',
        black: game.black_player?.full_name || 'Jugador desconocido',
        result: game.result as '1-0' | '0-1' | '1/2-1/2' | '*',
        whiteRating: game.white_player?.rating,
        blackRating: game.black_player?.rating,
        board: game.board_number,
        fen: game.fen,
        pgn: game.pgn,
        date: game.game_date,
        time: game.game_time,
        whitePlayerId: game.white_player?.id,
        blackPlayerId: game.black_player?.id
      }))

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
  const supabase = await createClient()
  
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
            club_a:clubs!matches_club_a_id_fkey(id, name),
            club_b:clubs!matches_club_b_id_fkey(id, name),
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
      const whiteTeam = isOddBoard ? matchGame.match?.club_a?.name : matchGame.match?.club_b?.name
      const blackTeam = isOddBoard ? matchGame.match?.club_b?.name : matchGame.match?.club_a?.name

      return {
        id: matchGame.id,
        round: matchGame.match?.round?.round_number || 1,
        white: matchGame.white_player?.full_name || 'Jugador desconocido',
        black: matchGame.black_player?.full_name || 'Jugador desconocido',
        result: matchGame.result as '1-0' | '0-1' | '1/2-1/2' | '*',
        whiteRating: matchGame.white_player?.rating,
        blackRating: matchGame.black_player?.rating,
        board: matchGame.board_number,
        fen: matchGame.fen,
        pgn: matchGame.pgn,
        date: matchGame.game_date,
        time: matchGame.game_time,
        whiteTeam,
        blackTeam,
        whitePlayerId: matchGame.white_player?.id,
        blackPlayerId: matchGame.black_player?.id,
        matchId: matchGame.match?.id
      }

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

      return {
        id: individualGame.id,
        round: individualGame.round?.round_number || 1,
        white: individualGame.white_player?.full_name || 'Jugador desconocido',
        black: individualGame.black_player?.full_name || 'Jugador desconocido',
        result: individualGame.result as '1-0' | '0-1' | '1/2-1/2' | '*',
        whiteRating: individualGame.white_player?.rating,
        blackRating: individualGame.black_player?.rating,
        board: individualGame.board_number,
        fen: individualGame.fen,
        pgn: individualGame.pgn,
        date: individualGame.game_date,
        time: individualGame.game_time,
        whitePlayerId: individualGame.white_player?.id,
        blackPlayerId: individualGame.black_player?.id
      }
    }
  } catch (error) {
    console.error('Error fetching game by ID:', error)
    return null
  }
}

// Get total rounds for a tournament from the database
export async function getTournamentRounds(tournamentId: number): Promise<number> {
  const supabase = await createClient()
  
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
      
      return tournament?.rounds || 6
    }

    return rounds[0].round_number
  } catch (error) {
    console.error('Error fetching tournament rounds:', error)
    return 6 // Default fallback
  }
} 