import * as XLSX from 'xlsx-js-style'
import {
  type PlayerRatings,
  type TournamentDetail,
  type RatingType,
  mapTipoToRatingType,
} from '@/lib/rankingUtils'
import type { ExcelPlayer, RankingPlayer } from './types'
import {
  normalizePlayerName,
  getFirstValueByKeys,
  findPointsRaw,
  findTipoRaw,
  findActiveRaw,
  parseActive,
} from './rowParser'

// ---------------------------------------------------------------------------
// Workbook detection
// ---------------------------------------------------------------------------

/**
 * Detects if the workbook has the multi-sheet format (Ranking + Analítico + Consolidado).
 * Accepts both the single-`Ranking` and the Sirafa split `Ranking 1/2/3` variants.
 */
export function isMultiSheetFormat(workbook: XLSX.WorkBook): boolean {
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
  const hasAnalitico = sheetNames.some(s => s === 'analitico' || s === 'analítico')
  const hasRanking = sheetNames.some(s => s === 'ranking')
  const hasSplitRanking = ['ranking 1', 'ranking 2', 'ranking 3'].every(n => sheetNames.includes(n))
  return hasAnalitico && (hasRanking || hasSplitRanking)
}

/**
 * Detects the Sirafa split-ranking format (Ranking 1 + Ranking 2 + Ranking 3).
 */
export function hasSplitRankingSheets(workbook: XLSX.WorkBook): boolean {
  const normalized = workbook.SheetNames.map(s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
  return ['ranking 1', 'ranking 2', 'ranking 3'].every(n => normalized.includes(n))
}

/**
 * Finds a sheet by name (accent-insensitive)
 */
export function findSheet(workbook: XLSX.WorkBook, targetName: string): XLSX.WorkSheet | null {
  const normalizedTarget = targetName.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const found = workbook.SheetNames.find(s =>
    s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') === normalizedTarget
  )
  return found ? workbook.Sheets[found] : null
}

// ---------------------------------------------------------------------------
// Sheet parsers
// ---------------------------------------------------------------------------

/**
 * Parses the Ranking sheet in multi-sheet format.
 * Groups rows by player ID/name, merging rating types into one player object.
 */
export function parseRankingSheetMulti(sheet: XLSX.WorkSheet): RankingPlayer[] {
  const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
  if (!rawData || rawData.length === 0) {
    throw new Error('La hoja "Ranking" está vacía')
  }

  const playerMap = new Map<string, RankingPlayer>()
  const errors: string[] = []

  rawData.forEach((row, index) => {
    const rowNumber = index + 2

    try {
      const name = row.Nombre || row.Name || row.NOMBRE || row.Jugador || ''
      if (!name || String(name).trim() === '') {
        if (Object.keys(row).length > 1) {
          errors.push(`Fila ${rowNumber}: Falta el nombre del jugador`)
        }
        return
      }

      const id = row.ID || row.Id || row.id || ''
      const title = row.TIT || row.Titulo || row.TITULO || row.Título || ''
      const club = row.Club || row.CLUB || ''
      const category = row['Categoría'] || row.Categoria || row.CATEGORIA || row.Cat || ''
      const points = findPointsRaw(row) ?? 0
      const matches = getFirstValueByKeys(row, [
        'Partidos', 'PARTIDOS', 'Matches', 'matches', 'N', 'n', 'Games',
      ]) ?? 0
      const activeRaw = findActiveRaw(row)

      // Detect rating type from Tipo column
      const tipoRaw = findTipoRaw(row)
      const tipoNum = tipoRaw !== undefined
        ? (typeof tipoRaw === 'number' ? tipoRaw : parseInt(String(tipoRaw)) || 1)
        : 1
      const ratingType = mapTipoToRatingType(tipoNum)

      const playerKey = String(id).trim() || normalizePlayerName(String(name))
      const pointsValue = Math.round(typeof points === 'number' ? points : parseFloat(String(points)) || 0)
      const matchesValue = typeof matches === 'number' ? matches : parseInt(String(matches)) || 0

      if (playerMap.has(playerKey)) {
        // Merge rating type into existing player
        const existing = playerMap.get(playerKey)!
        existing.ratings[ratingType] = pointsValue
        existing.matches += matchesValue
      } else {
        // New player entry
        const ratings: PlayerRatings = { standard: null, rapid: null, blitz: null }
        ratings[ratingType] = pointsValue

        playerMap.set(playerKey, {
          position: 0, // Will be computed later
          id: String(id).trim() || undefined,
          name: normalizePlayerName(String(name)),
          title: title ? String(title).trim().toUpperCase() : undefined,
          club: String(club).trim(),
          category: category ? String(category).trim() : undefined,
          points: 0, // Will be set from standard rating
          matches: matchesValue,
          ratings,
          active: parseActive(activeRaw),
        })
      }
    } catch (rowError) {
      errors.push(`Fila ${rowNumber}: Error al procesar datos - ${rowError instanceof Error ? rowError.message : 'Error desconocido'}`)
    }
  })

  if (errors.length > 0) {
    console.warn(`Skipped ${errors.length} rows with errors:`, errors)
  }

  // Convert map to array and compute positions
  const players = Array.from(playerMap.values())

  if (players.length === 0) {
    throw new Error('No se encontraron jugadores válidos en la hoja "Ranking"')
  }

  // Set points from standard rating (primary), and sort by standard rating for default position
  players.forEach(p => {
    p.points = p.ratings.standard || p.ratings.rapid || p.ratings.blitz || 0
  })

  // Sort by standard rating (descending) for default position
  players.sort((a, b) => (b.ratings.standard || 0) - (a.ratings.standard || 0))
  players.forEach((p, i) => { p.position = i + 1 })

  return players
}

/**
 * Parses the Sirafa split-ranking format: one sheet per modality
 * (Ranking 1 = standard, Ranking 2 = rápido, Ranking 3 = blitz).
 * Players are merged by ID across the three sheets.
 */
export function parseRankingSheetsSplit(workbook: XLSX.WorkBook): RankingPlayer[] {
  const sheetMap: Array<[string, RatingType]> = [
    ['Ranking 1', 'standard'],
    ['Ranking 2', 'rapid'],
    ['Ranking 3', 'blitz'],
  ]

  const playerMap = new Map<string, RankingPlayer>()
  const errors: string[] = []

  for (const [sheetName, ratingType] of sheetMap) {
    const sheet = findSheet(workbook, sheetName)
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${sheetName}" en el archivo`)
    }

    const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
    rawData.forEach((row, index) => {
      const rowNumber = index + 2
      try {
        const name = row.Nombre || row.Name || row.NOMBRE || row.Jugador || ''
        if (!name || String(name).trim() === '') return

        const id = row.ID || row.Id || row.id || ''
        const title = row.TIT || row.Titulo || row.TITULO || row.Título || ''
        const club = row.Club || row.CLUB || ''
        const category = row['Categoría'] || row.Categoria || row.CATEGORIA || row.Cat || ''
        const points = findPointsRaw(row) ?? 0
        const matches = getFirstValueByKeys(row, [
          'Partidos', 'PARTIDOS', 'Matches', 'matches', 'N', 'n', 'Games',
        ]) ?? 0
        const activeRaw = findActiveRaw(row)

        const playerKey = String(id).trim() || normalizePlayerName(String(name))
        const pointsValue = Math.round(typeof points === 'number' ? points : parseFloat(String(points)) || 0)
        const matchesValue = typeof matches === 'number' ? matches : parseInt(String(matches)) || 0

        if (playerMap.has(playerKey)) {
          const existing = playerMap.get(playerKey)!
          existing.ratings[ratingType] = pointsValue
          existing.matches += matchesValue
          // Prefer non-empty club/category/title from any sheet
          if (!existing.club && club) existing.club = String(club).trim()
          if (!existing.category && category) existing.category = String(category).trim()
          if (!existing.title && title) existing.title = String(title).trim().toUpperCase()
          if (!existing.active && parseActive(activeRaw)) existing.active = true
        } else {
          const ratings: PlayerRatings = { standard: null, rapid: null, blitz: null }
          ratings[ratingType] = pointsValue
          playerMap.set(playerKey, {
            position: 0,
            id: String(id).trim() || undefined,
            name: normalizePlayerName(String(name)),
            title: title ? String(title).trim().toUpperCase() : undefined,
            club: String(club).trim(),
            category: category ? String(category).trim() : undefined,
            points: 0,
            matches: matchesValue,
            ratings,
            active: parseActive(activeRaw),
          })
        }
      } catch (rowError) {
        errors.push(`${sheetName} fila ${rowNumber}: ${rowError instanceof Error ? rowError.message : 'Error desconocido'}`)
      }
    })
  }

  if (errors.length > 0) {
    console.warn(`Skipped ${errors.length} rows with errors:`, errors.slice(0, 10))
  }

  const players = Array.from(playerMap.values())
  if (players.length === 0) {
    throw new Error('No se encontraron jugadores válidos en las hojas "Ranking 1/2/3"')
  }

  players.forEach(p => {
    p.points = p.ratings.standard || p.ratings.rapid || p.ratings.blitz || 0
  })
  players.sort((a, b) => (b.ratings.standard || 0) - (a.ratings.standard || 0))
  players.forEach((p, i) => { p.position = i + 1 })

  return players
}

/**
 * Parses the Analítico sheet for tournament detail data
 */
export function parseAnaliticoSheet(sheet: XLSX.WorkSheet): TournamentDetail[] {
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)
  if (!rawData || rawData.length === 0) return []

  const details: TournamentDetail[] = []

  rawData.forEach((row, index) => {
    try {
      const periodo = String(row['Período'] || row.Periodo || row.PERIODO || row.Periodo || '')
      const playerId = String(row.ID || row.Id || row.id || '')
      const playerName = String(row.Jugador || row.Nombre || row.Name || '')
      const club = String(row.Club || row.CLUB || '')
      const eloBefore = parseFloat(row.Elo || row.ELO || row['Elo'] || 0)
      const wins = parseFloat(row.W || row.w || 0)
      const games = parseFloat(row.n || row.N || row.Partidos || 0)
      const expectedScore = parseFloat(row.We || row.WE || row.we || 0)
      const scoreDiff = parseFloat(row['W - We'] || row['W-We'] || 0)
      const avgOpponentRating = parseFloat(row.Ra || row.RA || row.ra || 0)
      const performanceRating = parseFloat(row.Rp || row.RP || row.rp || 0)
      const kFactor = parseFloat(row.K || row.k || 0)
      const eloChange = parseFloat(row['Elo +/-'] || row['Elo+/-'] || row['Elo +-'] || 0)
      const tipoRaw = row.Tipo || row.TIPO || row.tipo || 1
      const tipoNum = typeof tipoRaw === 'number' ? tipoRaw : parseInt(String(tipoRaw)) || 1
      const tournament = String(row.Torneo || row.TORNEO || row.Tournament || '')

      if (!playerName.trim() && !playerId.trim()) return

      details.push({
        periodo: periodo.trim(),
        playerId: playerId.trim(),
        playerName: normalizePlayerName(playerName),
        club: club.trim(),
        eloBefore: Math.round(eloBefore * 100) / 100,
        wins: Math.round(wins * 100) / 100,
        games: Math.round(games),
        expectedScore: Math.round(expectedScore * 100) / 100,
        scoreDiff: Math.round(scoreDiff * 100) / 100,
        avgOpponentRating: Math.round(avgOpponentRating),
        performanceRating: Math.round(performanceRating),
        kFactor: Math.round(kFactor),
        eloChange: Math.round(eloChange * 100) / 100,
        type: mapTipoToRatingType(tipoNum),
        tournament: tournament.trim(),
      })
    } catch (rowError) {
      console.warn(`Analítico row ${index + 2} error:`, rowError)
    }
  })

  return details
}

/**
 * Legacy single-sheet parsing (backward compatible)
 */
export function parseLegacySheet(sheet: XLSX.WorkSheet): RankingPlayer[] {
  const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
  if (!rawData || rawData.length === 0) {
    throw new Error('La hoja de Excel está vacía o no contiene datos válidos')
  }

  const playerMap = new Map<string, RankingPlayer>()
  const errors: string[] = []

  // Check if any row has a Tipo column to decide multi-rating vs single-rating
  const hasTipoColumn = rawData.some(row => findTipoRaw(row) !== undefined)

  rawData.forEach((row, index) => {
    const rowNumber = index + 2
    try {
      const activeRaw = findActiveRaw(row)
      const name = row.Nombre || row.Name || row.NOMBRE || row.Jugador || ''
      const id = row.ID || row.Id || row.id || ''
      const title = row.TIT || row.Titulo || row.TITULO || row.Título || ''
      const club = row.Club || row.CLUB || ''
      const category = row['Categoría'] || row.Categoria || row.CATEGORIA || row.Cat || ''
      const points = findPointsRaw(row) ?? 0
      const matches = getFirstValueByKeys(row, [
        'Partidos', 'PARTIDOS', 'Matches', 'matches', 'N', 'n', 'Games',
      ]) ?? 0

      if (!name || String(name).trim() === '') {
        if (Object.keys(row).length > 1) {
          errors.push(`Fila ${rowNumber}: Falta el nombre del jugador`)
        }
        return
      }

      const pointsValue = Math.round(typeof points === 'number' ? points : parseInt(String(points)) || 0)
      const matchesValue = typeof matches === 'number' ? matches : parseInt(String(matches)) || 0

      if (hasTipoColumn) {
        // Multi-rating: merge rows by player using Tipo column
        const tipoRaw = findTipoRaw(row)
        const tipoNum = tipoRaw !== undefined
          ? (typeof tipoRaw === 'number' ? tipoRaw : parseInt(String(tipoRaw)) || 1)
          : 1
        const ratingType = mapTipoToRatingType(tipoNum)
        const playerKey = String(id).trim() || normalizePlayerName(String(name))

        if (playerMap.has(playerKey)) {
          const existing = playerMap.get(playerKey)!
          existing.ratings[ratingType] = pointsValue
          existing.matches += matchesValue
        } else {
          const ratings: PlayerRatings = { standard: null, rapid: null, blitz: null }
          ratings[ratingType] = pointsValue

          playerMap.set(playerKey, {
            position: 0,
            id: String(id).trim() || undefined,
            name: normalizePlayerName(String(name)),
            title: title ? String(title).trim().toUpperCase() : undefined,
            club: String(club).trim(),
            category: category ? String(category).trim() : undefined,
            points: 0,
            matches: matchesValue,
            ratings,
            active: parseActive(activeRaw),
          })
        }
      } else {
        // Single-rating: all points go to standard
        const playerKey = String(id).trim() || normalizePlayerName(String(name))
        playerMap.set(playerKey, {
          position: 0,
          id: String(id).trim() || undefined,
          name: normalizePlayerName(String(name)),
          title: title ? String(title).trim().toUpperCase() : undefined,
          club: String(club).trim(),
          category: category ? String(category).trim() : undefined,
          points: pointsValue,
          matches: matchesValue,
          ratings: { standard: pointsValue, rapid: null, blitz: null },
          active: parseActive(activeRaw),
        })
      }
    } catch (rowError) {
      errors.push(`Fila ${rowNumber}: Error al procesar datos - ${rowError instanceof Error ? rowError.message : 'Error desconocido'}`)
    }
  })

  const transformedData = Array.from(playerMap.values())

  if (errors.length > 0 && transformedData.length === 0) {
    const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : []
    const columnInfo = availableColumns.length > 0 ?
      `\n\nColumnas encontradas en el archivo: ${availableColumns.join(', ')}\n\nColumnas esperadas: Nombre/Name/NOMBRE, Club/CLUB, Puntos/Points/ELO, Partidos/Matches/PARTIDOS, Activo/ACTIVO` : ''
    throw new Error(`Error al procesar el archivo Excel:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... y ${errors.length - 5} errores más` : ''}${columnInfo}`)
  }

  if (transformedData.length === 0) {
    throw new Error('No se encontraron jugadores válidos en el archivo Excel.')
  }

  if (errors.length > 0) {
    console.warn(`Skipped ${errors.length} rows with errors:`, errors)
  }

  // Assign positions and set legacy points from standard rating
  transformedData
    .sort((a, b) => (b.ratings.standard || 0) - (a.ratings.standard || 0))
    .forEach((player, i) => {
      player.position = i + 1
      player.points = player.ratings.standard || 0
    })

  return transformedData
}
