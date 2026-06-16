import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

interface Tournament {
  id: number
  title: string
  tournament_type: 'individual' | 'team'
}

interface IndividualGame {
  id: number
  board_number?: number
  result: string
  pgn?: string
  game_date?: string
  white_player: Player
  black_player: Player
  round: Round
}

interface MatchGame {
  id: number
  board_number: number
  result: string
  pgn?: string
  game_date?: string
  white_player: Player
  black_player: Player
  match: {
    id: number
    club_a: Club
    club_b: Club
    round: Round
  }
}

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

async function getIndividualGames(tournamentId: number): Promise<IndividualGame[]> {
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

  return (data || []).filter(g => g.pgn && g.pgn.trim() !== '') as unknown as IndividualGame[]
}

async function getMatchGames(tournamentId: number): Promise<MatchGame[]> {
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
        club_a:club_a_id(id, name),
        club_b:club_b_id(id, name),
        round:round_id(id, round_number)
      )
    `)
    .not('pgn', 'is', null)

  if (error) {
    console.error(`Error fetching match games:`, error)
    return []
  }

  // Filter by tournament_id through round
  const filteredGames: MatchGame[] = []
  for (const game of data || []) {
    if (game.pgn && game.pgn.trim() !== '' && game.match?.round) {
      // Check if this round belongs to our tournament
      const { data: roundData } = await supabase
        .from('rounds')
        .select('tournament_id')
        .eq('id', game.match.round.id)
        .single()

      if (roundData?.tournament_id === tournamentId) {
        filteredGames.push(game as unknown as MatchGame)
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
  const tournamentsWithGames: { name: string; gameCount: number }[] = []

  for (const tournament of tournaments as Tournament[]) {
    console.log(`\nProcessing: ${tournament.title} (${tournament.tournament_type})`)

    let games: (IndividualGame | MatchGame)[] = []

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
    tournamentsWithGames.push({ name: tournament.title, gameCount: games.length })

    for (const game of games) {
      if (!game.pgn) continue

      const isMatchGame = 'match' in game
      const roundNumber = isMatchGame
        ? (game as MatchGame).match.round.round_number
        : (game as IndividualGame).round.round_number

      const whiteName = game.white_player?.full_name || 'Unknown'
      const blackName = game.black_player?.full_name || 'Unknown'
      const whiteRating = game.white_player?.rating
      const blackRating = game.black_player?.rating

      let whiteTeam: string | undefined
      let blackTeam: string | undefined

      if (isMatchGame) {
        const matchGame = game as MatchGame
        whiteTeam = matchGame.match.club_a?.name
        blackTeam = matchGame.match.club_b?.name
      }

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
        game.result,
        tournament.title,
        roundNumber,
        game.board_number,
        game.game_date,
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
