import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import type { Database } from '../lib/database.types'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

type GamePlayer = { full_name: string; rating: number | null } | null

// One exported game, normalized from individual_games or match_games rows.
interface ExportGame {
  pgn: string
  result: string | null
  board_number: number | null
  game_date: string | null
  roundNumber: number
  white: GamePlayer
  black: GamePlayer
  whiteTeam?: string
  blackTeam?: string
}

const hasPgn = (pgn: string | null): pgn is string => !!pgn && pgn.trim() !== ''

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
}

function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 150)
}

function formatPGN(
  pgn: string,
  whiteName: string,
  blackName: string,
  result: string,
  tournamentName: string,
  roundNumber: number,
  boardNumber?: number,
  gameDate?: string,
  whiteRating?: number,
  blackRating?: number,
  whiteTeam?: string,
  blackTeam?: string
): string {
  const lines: string[] = []

  // Add PGN headers
  lines.push(`[Event "${tournamentName}"]`)
  lines.push(`[Site "FASGBA"]`)
  lines.push(`[Date "${gameDate ? gameDate.replace(/-/g, '.') : '????.??.??'}"]`)
  lines.push(`[Round "${roundNumber}${boardNumber ? '.' + boardNumber : ''}"]`)
  lines.push(`[White "${whiteName}"]`)
  lines.push(`[Black "${blackName}"]`)
  lines.push(`[Result "${result || '*'}"]`)

  if (whiteRating) {
    lines.push(`[WhiteElo "${whiteRating}"]`)
  }
  if (blackRating) {
    lines.push(`[BlackElo "${blackRating}"]`)
  }
  if (whiteTeam) {
    lines.push(`[WhiteTeam "${whiteTeam}"]`)
  }
  if (blackTeam) {
    lines.push(`[BlackTeam "${blackTeam}"]`)
  }

  lines.push('')

  // Add the moves
  lines.push(pgn)
  lines.push('')

  return lines.join('\n')
}

async function getIndividualGames(tournamentId: number): Promise<ExportGame[]> {
  const { data, error } = await supabase
    .from('individual_games')
    .select(`
      id,
      board_number,
      result,
      pgn,
      game_date,
      white_player:white_player_id(id, full_name, rating),
      black_player:black_player_id(id, full_name, rating),
      round:round_id(id, round_number)
    `)
    .eq('round.tournament_id', tournamentId)
    .not('pgn', 'is', null)

  if (error) {
    console.error(`Error fetching individual games for tournament ${tournamentId}:`, error)
    return []
  }

  const games: ExportGame[] = []
  for (const g of data || []) {
    if (!hasPgn(g.pgn) || !g.round) continue
    games.push({
      pgn: g.pgn,
      result: g.result,
      board_number: g.board_number,
      game_date: g.game_date,
      roundNumber: g.round.round_number,
      white: g.white_player,
      black: g.black_player,
    })
  }
  return games
}

async function getMatchGames(tournamentId: number): Promise<ExportGame[]> {
  const { data, error } = await supabase
    .from('match_games')
    .select(`
      id,
      board_number,
      result,
      pgn,
      game_date,
      white_player:white_player_id(id, full_name, rating),
      black_player:black_player_id(id, full_name, rating),
      match:match_id(
        id,
        team_a:team_a_id(id, name),
        team_b:team_b_id(id, name),
        round:round_id(id, round_number)
      )
    `)
    .not('pgn', 'is', null)

  if (error) {
    console.error(`Error fetching match games:`, error)
    return []
  }

  // Filter by tournament_id through round
  const filteredGames: ExportGame[] = []
  for (const game of data || []) {
    const round = game.match?.round
    if (hasPgn(game.pgn) && game.match && round) {
      // Check if this round belongs to our tournament
      const { data: roundData } = await supabase
        .from('rounds')
        .select('tournament_id')
        .eq('id', round.id)
        .single()

      if (roundData?.tournament_id === tournamentId) {
        filteredGames.push({
          pgn: game.pgn,
          result: game.result,
          board_number: game.board_number,
          game_date: game.game_date,
          roundNumber: round.round_number,
          white: game.white_player,
          black: game.black_player,
          whiteTeam: game.match.team_a?.name,
          blackTeam: game.match.team_b?.name,
        })
      }
    }
  }

  return filteredGames
}

async function main() {
  console.log('Fetching all tournaments...')

  // Fetch all tournaments
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, title, tournament_type')
    .order('id', { ascending: false })

  if (error) {
    console.error('Error fetching tournaments:', error)
    process.exit(1)
  }

  if (!tournaments || tournaments.length === 0) {
    console.log('No tournaments found')
    process.exit(0)
  }

  console.log(`Found ${tournaments.length} tournaments`)

  // Create PartidasTorneos folder
  const baseDir = path.join(process.cwd(), 'PartidasTorneos')
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
    console.log(`Created folder: ${baseDir}`)
  }

  let totalGames = 0
  const tournamentsWithGames: { title: string; gameCount: number }[] = []

  for (const tournament of tournaments) {
    console.log(`\nProcessing: ${tournament.title} (${tournament.tournament_type})`)

    let games: ExportGame[] = []

    if (tournament.tournament_type === 'individual') {
      games = await getIndividualGames(tournament.id)
    } else if (tournament.tournament_type === 'team') {
      games = await getMatchGames(tournament.id)
    }

    if (games.length === 0) {
      console.log(`  No games with PGN found`)
      continue
    }

    // Create tournament folder
    const tournamentFolder = sanitizeFolderName(tournament.title)
    const tournamentDir = path.join(baseDir, tournamentFolder)
    if (!fs.existsSync(tournamentDir)) {
      fs.mkdirSync(tournamentDir, { recursive: true })
    }

    console.log(`  Found ${games.length} games with PGN`)
    tournamentsWithGames.push({ title: tournament.title, gameCount: games.length })

    for (const game of games) {
      const roundNumber = game.roundNumber
      const whiteName = game.white?.full_name || 'Unknown'
      const blackName = game.black?.full_name || 'Unknown'
      const whiteRating = game.white?.rating ?? undefined
      const blackRating = game.black?.rating ?? undefined
      const whiteTeam = game.whiteTeam
      const blackTeam = game.blackTeam

      // Create filename
      const boardStr = game.board_number ? `T${game.board_number}_` : ''
      const baseFilename = sanitizeFilename(
        `R${roundNumber}_${boardStr}${whiteName}_vs_${blackName}`
      )

      // Handle duplicates
      let filename = `${baseFilename}.pgn`
      let counter = 1
      while (fs.existsSync(path.join(tournamentDir, filename))) {
        filename = `${baseFilename}_${counter}.pgn`
        counter++
      }

      const pgnContent = formatPGN(
        game.pgn,
        whiteName,
        blackName,
        game.result ?? '',
        tournament.title,
        roundNumber,
        game.board_number ?? undefined,
        game.game_date ?? undefined,
        whiteRating,
        blackRating,
        whiteTeam,
        blackTeam
      )

      const filepath = path.join(tournamentDir, filename)
      fs.writeFileSync(filepath, pgnContent, 'utf-8')
      totalGames++
    }

    console.log(`  Created ${games.length} PGN files in ${tournamentFolder}/`)
  }

  console.log('\n=== Summary ===')
  console.log(`Total tournaments scanned: ${tournaments.length}`)
  console.log(`Tournaments with games: ${tournamentsWithGames.length}`)
  console.log(`Total PGN files created: ${totalGames}`)

  if (tournamentsWithGames.length > 0) {
    console.log('\nTournaments with games:')
    for (const item of tournamentsWithGames) {
      console.log(`  - "${item.title}" (${item.gameCount} game${item.gameCount > 1 ? 's' : ''})`)
    }
  }
}

main().catch(console.error)
