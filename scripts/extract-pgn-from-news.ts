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

interface ChessGameBlock {
  id: string
  type: 'chess_game'
  content: {
    pgn: string
    whitePlayer?: {
      type: 'custom' | 'anonymous'
      value: string
    }
    blackPlayer?: {
      type: 'custom' | 'anonymous'
      value: string
    }
    result?: '1-0' | '0-1' | '1/2-1/2' | '*'
  }
}

interface ContentBlock {
  id: string
  type: 'text' | 'image' | 'chess_game'
  content: any
}

interface NewsItem {
  id: number
  title: string
  date: string
  text: string
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
}

function formatPGN(game: ChessGameBlock['content'], newsTitle: string, newsDate: string): string {
  const lines: string[] = []

  // Add PGN headers
  lines.push(`[Event "${newsTitle}"]`)
  lines.push(`[Site "FASGBA"]`)
  lines.push(`[Date "${newsDate.split('T')[0].replace(/-/g, '.')}"]`)

  const whiteName = game.whitePlayer?.type === 'custom' && game.whitePlayer.value
    ? game.whitePlayer.value
    : '?'
  const blackName = game.blackPlayer?.type === 'custom' && game.blackPlayer.value
    ? game.blackPlayer.value
    : '?'

  lines.push(`[White "${whiteName}"]`)
  lines.push(`[Black "${blackName}"]`)
  lines.push(`[Result "${game.result || '*'}"]`)
  lines.push('')

  // Add the moves
  lines.push(game.pgn)
  lines.push('')

  return lines.join('\n')
}

async function main() {
  console.log('Fetching all news articles...')

  // Fetch all news
  const { data: newsItems, error } = await supabase
    .from('news')
    .select('id, title, date, text')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching news:', error)
    process.exit(1)
  }

  if (!newsItems || newsItems.length === 0) {
    console.log('No news articles found')
    process.exit(0)
  }

  console.log(`Found ${newsItems.length} news articles`)

  // Create Partidas folder
  const partidasDir = path.join(process.cwd(), 'Partidas')
  if (!fs.existsSync(partidasDir)) {
    fs.mkdirSync(partidasDir, { recursive: true })
    console.log(`Created folder: ${partidasDir}`)
  }

  let totalGames = 0
  const gamesFound: { newsId: number; newsTitle: string; gameCount: number }[] = []

  for (const news of newsItems as NewsItem[]) {
    // Parse the text field as JSON
    let contentBlocks: ContentBlock[]
    try {
      contentBlocks = JSON.parse(news.text)
    } catch {
      // If it's not JSON, it might be old HTML content - skip
      continue
    }

    if (!Array.isArray(contentBlocks)) {
      continue
    }

    // Find chess game blocks
    const chessGames = contentBlocks.filter(
      (block): block is ChessGameBlock => block.type === 'chess_game'
    )

    if (chessGames.length === 0) {
      continue
    }

    gamesFound.push({
      newsId: news.id,
      newsTitle: news.title,
      gameCount: chessGames.length
    })

    // Create PGN files for each game
    for (let i = 0; i < chessGames.length; i++) {
      const game = chessGames[i]

      if (!game.content?.pgn) {
        console.log(`  Skipping game ${i + 1} in news ${news.id} - no PGN data`)
        continue
      }

      const whiteName = game.content.whitePlayer?.value || 'Unknown'
      const blackName = game.content.blackPlayer?.value || 'Unknown'

      // Create filename
      const baseFilename = sanitizeFilename(
        `${news.date.split('T')[0]}_${whiteName}_vs_${blackName}`
      )

      // Handle multiple games with same players
      let filename = `${baseFilename}.pgn`
      let counter = 1
      while (fs.existsSync(path.join(partidasDir, filename))) {
        filename = `${baseFilename}_${counter}.pgn`
        counter++
      }

      const pgnContent = formatPGN(game.content, news.title, news.date)
      const filepath = path.join(partidasDir, filename)

      fs.writeFileSync(filepath, pgnContent, 'utf-8')
      console.log(`  Created: ${filename}`)
      totalGames++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total news articles scanned: ${newsItems.length}`)
  console.log(`Articles with chess games: ${gamesFound.length}`)
  console.log(`Total PGN files created: ${totalGames}`)

  if (gamesFound.length > 0) {
    console.log('\nNews articles with games:')
    for (const item of gamesFound) {
      console.log(`  - [${item.newsId}] "${item.newsTitle}" (${item.gameCount} game${item.gameCount > 1 ? 's' : ''})`)
    }
  }
}

main().catch(console.error)
