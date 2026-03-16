import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, payloadTooLargeError, forbiddenError } from '@/lib/utils/apiResponse'
import * as XLSX from 'xlsx-js-style'
import {
  type Player,
  type PlayerRatings,
  type TournamentDetail,
  type AnalyticsData,
  type RatingType,
  mapTipoToRatingType,
  computePositionsByRatingType,
  normalizePlayer,
} from '@/lib/rankingUtils'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel' // .xls
]

interface ExcelPlayer {
  __EMPTY?: number;
  ID?: string;
  TIT?: string;
  Nombre?: string;
  'Ranking Nuevo'?: number;
  Club?: string;
  'Categoría'?: string;
  Posicion?: number;
  Puntos?: number;
  Partidos?: number;
  [key: string]: any;
}

interface RankingPlayer {
  position: number;
  id?: string;
  name: string;
  title?: string;
  club: string;
  category?: string;
  points: number;
  matches: number;
  ratings: PlayerRatings;
  active: boolean;
  changes?: {
    position: number | null;
    points: number;
    ratings?: { standard: number; rapid: number; blitz: number };
    isNew: boolean;
  };
}

interface PreviousPlayer {
  position: number;
  name: string;
  id?: string;
  points: number;
  ratings?: PlayerRatings;
}

// Helper function to normalize names with proper capitalization
const normalizePlayerName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper to find a column value by fuzzy name
const getFirstValueByKeys = (obj: Record<string, any>, keys: string[]): any => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
  }
  return undefined
}

const findPointsRaw = (obj: Record<string, any>): any => {
  const direct = getFirstValueByKeys(obj, [
    'Puntos', 'PUNTOS', 'Ranking Nuevo', 'Ranking No', 'Ranking Nro',
    'Points', 'ELO', 'Elo', 'elo', 'Rating', 'RATING', 'Puntaje', 'PUNTAJE',
  ])
  if (direct !== undefined) return direct
  const pointsKey = Object.keys(obj).find(k => /puntos|ranking|points|elo|rating|puntaje/i.test(k))
  return pointsKey ? obj[pointsKey] : undefined
}

const findActiveRaw = (obj: Record<string, any>): any => {
  const direct = getFirstValueByKeys(obj, [
    'Activo', 'ACTIVO', 'active', 'Active', 'ACTIVE', 'Act', 'ACT'
  ])
  if (direct !== undefined) return direct
  const activeKey = Object.keys(obj).find(k => /activo|active|act/i.test(k))
  return activeKey ? obj[activeKey] : undefined
}

const parseActive = (value: any): boolean => {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 || value > 0
  const normalized = String(value).trim().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (normalized === '1') return true
  if (['si','s','sí','si ','siempre', 'true','t','y','yes','x','activo','act','activos'].includes(normalized)) return true
  if (['no','n','false','0','inactivo','inact','inactive','non'].includes(normalized)) return false
  return false
}

/**
 * Detects if the workbook has the multi-sheet format (Ranking + Analítico + Consolidado)
 */
function isMultiSheetFormat(workbook: XLSX.WorkBook): boolean {
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
  return sheetNames.some(s => s === 'ranking') &&
    sheetNames.some(s => s === 'analitico' || s === 'analítico')
}

/**
 * Finds a sheet by name (accent-insensitive)
 */
function findSheet(workbook: XLSX.WorkBook, targetName: string): XLSX.WorkSheet | null {
  const normalizedTarget = targetName.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const found = workbook.SheetNames.find(s =>
    s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') === normalizedTarget
  )
  return found ? workbook.Sheets[found] : null
}

/**
 * Parses the Ranking sheet in multi-sheet format.
 * Groups rows by player ID/name, merging rating types into one player object.
 */
function parseRankingSheetMulti(sheet: XLSX.WorkSheet): RankingPlayer[] {
  const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
  if (!rawData || rawData.length === 0) {
    throw new Error('La hoja "Ranking" está vacía')
  }

  // Log detected columns for debugging
  if (rawData.length > 0) {
    console.log('Detected Excel columns:', Object.keys(rawData[0]))
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
      const tipoRaw = getFirstValueByKeys(row, ['Tipo', 'TIPO', 'Tipo de Rating', 'Type', 'tipo'])
      const tipoNum = typeof tipoRaw === 'number' ? tipoRaw : parseInt(String(tipoRaw)) || 1
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
 * Parses the Analítico sheet for tournament detail data
 */
function parseAnaliticoSheet(sheet: XLSX.WorkSheet): TournamentDetail[] {
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
function parseLegacySheet(sheet: XLSX.WorkSheet): RankingPlayer[] {
  const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet)
  if (!rawData || rawData.length === 0) {
    throw new Error('La hoja de Excel está vacía o no contiene datos válidos')
  }

  const transformedData: RankingPlayer[] = []
  const errors: string[] = []

  rawData.forEach((row, index) => {
    const rowNumber = index + 2
    try {
      const activeRaw = findActiveRaw(row)
      const name = row.Nombre || row.Name || row.NOMBRE || ''
      const title = row.TIT || row.Titulo || row.TITULO || ''
      const club = row.Club || row.CLUB || ''
      const points = findPointsRaw(row) ?? 0
      const matches = getFirstValueByKeys(row, [
        'Partidos', 'PARTIDOS', 'Matches', 'matches', 'N', 'n', 'Games',
      ]) ?? 0
      const position = index + 1

      if (!name || String(name).trim() === '') {
        if (Object.keys(row).length > 1) {
          errors.push(`Fila ${rowNumber}: Falta el nombre del jugador`)
        }
        return
      }

      const pointsValue = Math.round(typeof points === 'number' ? points : parseInt(String(points)) || 0)

      transformedData.push({
        position,
        name: normalizePlayerName(String(name)),
        title: title ? String(title).trim().toUpperCase() : undefined,
        club: String(club).trim(),
        points: pointsValue,
        matches: typeof matches === 'number' ? matches : parseInt(String(matches)) || 0,
        ratings: { standard: pointsValue, rapid: null, blitz: null },
        active: parseActive(activeRaw),
      })
    } catch (rowError) {
      errors.push(`Fila ${rowNumber}: Error al procesar datos - ${rowError instanceof Error ? rowError.message : 'Error desconocido'}`)
    }
  })

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

  return transformedData.sort((a, b) => a.position - b.position)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !adminData) {
      return forbiddenError('Admin access required')
    }

    const adminSupabase = createAdminClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const month = formData.get('month') as string
    const year = formData.get('year') as string

    if (!file) {
      return handleError(new Error('No file provided'))
    }

    if (!month || !year) {
      return handleError(new Error('Month and year are required'))
    }

    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return handleError(new Error(`File type must be Excel (.xlsx or .xls). Received: ${file.type}`))
    }

    const filename = `ranking-${month.padStart(2, '0')}-${year}`
    const tempExcelPath = `temp/${filename}.xlsx`
    const tempJsonPath = `temp/${filename}.json`
    const tempAnalyticsPath = `temp/${filename}-analytics.json`

    // Upload Excel file to temp storage
    const { error: uploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(tempExcelPath, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return handleError(new Error('Failed to upload file: ' + uploadError.message))
    }

    let rankingData: RankingPlayer[]
    let analyticsDetails: TournamentDetail[] = []
    let isMultiSheet = false

    try {
      const fileBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de trabajo válidas')
      }

      if (isMultiSheetFormat(workbook)) {
        // Multi-sheet format: Ranking + Analítico + Consolidado
        isMultiSheet = true
        const rankingSheet = findSheet(workbook, 'Ranking')
        if (!rankingSheet) {
          throw new Error('No se encontró la hoja "Ranking" en el archivo')
        }
        rankingData = parseRankingSheetMulti(rankingSheet)

        // Parse Analítico sheet
        const analiticoSheet = findSheet(workbook, 'Analítico') || findSheet(workbook, 'Analitico')
        if (analiticoSheet) {
          analyticsDetails = parseAnaliticoSheet(analiticoSheet)
        }
      } else {
        // Legacy single-sheet format
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) {
          throw new Error(`No se pudo acceder a la hoja de trabajo: ${sheetName}`)
        }
        rankingData = parseLegacySheet(sheet)
      }
    } catch (parseError) {
      await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])
      console.error('Parse error:', parseError)
      if (parseError instanceof Error) {
        return handleError(new Error(`Error al procesar el archivo Excel: ${parseError.message}`))
      }
      return handleError(new Error('Error desconocido al procesar el archivo Excel.'))
    }

    // Compute positions for each rating type
    const playersWithPositions = computePositionsByRatingType(rankingData as Player[])
    rankingData = playersWithPositions as RankingPlayer[]

    // Find previous ranking and calculate changes
    const previousRanking = await findPreviousRanking(adminSupabase, parseInt(month), parseInt(year))

    let enhancedRankingData: RankingPlayer[]
    if (previousRanking) {
      enhancedRankingData = calculatePlayerChanges(rankingData, previousRanking.players)
    } else {
      enhancedRankingData = rankingData.map(player => ({
        ...player,
        changes: {
          position: null,
          points: 0,
          ratings: { standard: 0, rapid: 0, blitz: 0 },
          isNew: true
        }
      }))
    }

    // Create JSON data
    const jsonData = {
      version: 2,
      filename,
      lastUpdated: new Date().toISOString(),
      totalPlayers: enhancedRankingData.length,
      month: parseInt(month),
      year: parseInt(year),
      previousRanking: previousRanking?.filename || null,
      players: enhancedRankingData,
      analyticsFilename: analyticsDetails.length > 0 ? `${filename}-analytics` : undefined,
    }

    // Upload ranking JSON to temp
    const jsonBuffer = Buffer.from(JSON.stringify(jsonData, null, 2))
    const { error: jsonUploadError } = await adminSupabase.storage
      .from('ranking-data')
      .upload(tempJsonPath, jsonBuffer, {
        contentType: 'application/json',
        upsert: true
      })

    if (jsonUploadError) {
      await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])
      console.error('JSON upload error:', jsonUploadError)
      return handleError(new Error('Failed to process ranking data'))
    }

    // Upload analytics JSON to temp if available
    if (analyticsDetails.length > 0) {
      const analyticsData: AnalyticsData = {
        filename: `${filename}-analytics`,
        rankingFilename: filename,
        month: parseInt(month),
        year: parseInt(year),
        details: analyticsDetails,
      }

      const analyticsBuffer = Buffer.from(JSON.stringify(analyticsData, null, 2))
      const { error: analyticsUploadError } = await adminSupabase.storage
        .from('ranking-data')
        .upload(tempAnalyticsPath, analyticsBuffer, {
          contentType: 'application/json',
          upsert: true
        })

      if (analyticsUploadError) {
        console.warn('Failed to upload analytics data:', analyticsUploadError)
        // Don't fail the upload - analytics is supplementary
      }
    }

    // Delete the temp Excel file
    await adminSupabase.storage.from('ranking-data').remove([tempExcelPath])

    return apiSuccess({
      filename,
      totalPlayers: enhancedRankingData.length,
      previewData: enhancedRankingData.slice(0, 10),
      tempJsonPath,
      tempAnalyticsPath: analyticsDetails.length > 0 ? tempAnalyticsPath : undefined,
      isMultiSheet,
      hasAnalytics: analyticsDetails.length > 0,
      analyticsCount: analyticsDetails.length,
      requiresRecalculation: await checkIfRecalculationNeeded(adminSupabase, parseInt(month), parseInt(year))
    })

  } catch (error) {
    return handleError(error)
  }
}

// Helper function to find previous ranking
async function findPreviousRanking(adminSupabase: any, currentMonth: number, currentYear: number) {
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError || !files) {
      console.warn('Could not list files to find previous ranking:', listError)
      return null
    }

    const rankingFiles = files
      .filter((file: any) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        !file.name.includes('-analytics') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: any) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        return {
          filename: file.name,
          month: parseInt(match[1]),
          year: parseInt(match[2]),
          date: new Date(parseInt(match[2]), parseInt(match[1]) - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean)

    // Check for same month/year ranking first
    const sameMonthRankings = rankingFiles
      .filter((ranking: any) => ranking.month === currentMonth && ranking.year === currentYear)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    if (sameMonthRankings.length > 0) {
      const sameMonthPrevious = sameMonthRankings[sameMonthRankings.length - 1]
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(sameMonthPrevious.filename)

      if (!downloadError && fileData) {
        const jsonContent = await fileData.text()
        const previousData = JSON.parse(jsonContent)
        return {
          filename: sameMonthPrevious.filename.replace('.json', ''),
          players: (previousData.players || []).map(normalizePlayer)
        }
      }
    }

    // Fall back to chronologically previous ranking
    const chronologicalRankings = rankingFiles
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())

    const currentDate = new Date(currentYear, currentMonth - 1)
    const previousRanking = chronologicalRankings.find((ranking: any) =>
      ranking.date.getTime() < currentDate.getTime()
    )

    if (!previousRanking) return null

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('ranking-data')
      .download(previousRanking.filename)

    if (downloadError || !fileData) {
      console.warn('Could not download previous ranking:', downloadError)
      return null
    }

    const jsonContent = await fileData.text()
    const previousData = JSON.parse(jsonContent)
    return {
      filename: previousRanking.filename.replace('.json', ''),
      players: (previousData.players || []).map(normalizePlayer)
    }
  } catch (error) {
    console.warn('Error finding previous ranking:', error)
    return null
  }
}

// Calculate changes for each player, including per-rating changes
function calculatePlayerChanges(newPlayers: RankingPlayer[], previousPlayers: any[]) {
  const normalizeName = (name: string): string => {
    return name.trim().toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return newPlayers.map(player => {
    // Match by ID first, then by name
    const previousPlayer = previousPlayers.find(p =>
      (player.id && p.id && player.id === p.id) ||
      normalizeName(p.name) === normalizeName(player.name)
    )

    if (!previousPlayer) {
      return {
        ...player,
        changes: {
          position: null,
          points: 0,
          ratings: { standard: 0, rapid: 0, blitz: 0 },
          isNew: true
        }
      }
    }

    const positionChange = previousPlayer.position - player.position
    const pointsChange = Math.round(player.points - (previousPlayer.points || 0))

    const prevRatings = previousPlayer.ratings || { standard: previousPlayer.points || 0, rapid: null, blitz: null }
    const ratingChanges = {
      standard: Math.round((player.ratings.standard || 0) - (prevRatings.standard || 0)),
      rapid: Math.round((player.ratings.rapid || 0) - (prevRatings.rapid || 0)),
      blitz: Math.round((player.ratings.blitz || 0) - (prevRatings.blitz || 0)),
    }

    return {
      ...player,
      changes: {
        position: positionChange,
        points: pointsChange,
        ratings: ratingChanges,
        isNew: false
      }
    }
  })
}

async function checkIfRecalculationNeeded(adminSupabase: any, currentMonth: number, currentYear: number): Promise<boolean> {
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (listError || !files) return false

    const rankingFiles = files
      .filter((file: any) =>
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        !file.name.includes('-analytics') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map((file: any) => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        return {
          filename: file.name,
          date: new Date(parseInt(match[2]), parseInt(match[1]) - 1)
        }
      })
      .filter(Boolean)

    const currentDate = new Date(currentYear, currentMonth - 1)
    return rankingFiles.some((ranking: any) => ranking.date.getTime() > currentDate.getTime())
  } catch (error) {
    console.warn('Error checking recalculation need:', error)
    return false
  }
}
