import type { SupabaseClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx-js-style'
import {
  type Player,
  type TournamentDetail,
  type AnalyticsData,
  computePositionsByRatingType,
} from '@/lib/rankingUtils'
import type { ParsedRanking, BuiltJson, RankingPlayer } from './types'
import {
  isMultiSheetFormat,
  hasSplitRankingSheets,
  findSheet,
  parseRankingSheetMulti,
  parseRankingSheetsSplit,
  parseAnaliticoSheet,
  parseLegacySheet,
} from './sheetParsers'
import {
  findPreviousRanking,
  calculatePlayerChanges,
  checkIfRecalculationNeeded,
} from './history'

/**
 * Parse the workbook + look up previous ranking + compute changes.
 * High-level entry point for the action.
 */
export async function parseWorkbook(
  workbook: XLSX.WorkBook,
  month: number,
  year: number,
  adminClient: SupabaseClient
): Promise<ParsedRanking> {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene hojas de trabajo válidas')
  }

  let rankingData: RankingPlayer[]
  let analyticsDetails: TournamentDetail[] = []
  let isMultiSheet = false

  if (isMultiSheetFormat(workbook)) {
    // Multi-sheet format: Ranking(+) + Analítico + Consolidado
    isMultiSheet = true
    if (hasSplitRankingSheets(workbook)) {
      rankingData = parseRankingSheetsSplit(workbook)
    } else {
      const rankingSheet = findSheet(workbook, 'Ranking')
      if (!rankingSheet) {
        throw new Error('No se encontró la hoja "Ranking" en el archivo')
      }
      rankingData = parseRankingSheetMulti(rankingSheet)
    }

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

  // Compute positions for each rating type
  const playersWithPositions = computePositionsByRatingType(rankingData as Player[])
  rankingData = playersWithPositions as RankingPlayer[]

  // Find previous ranking and calculate changes
  const previousRanking = await findPreviousRanking(adminClient, month, year)

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

  const requiresRecalculation = await checkIfRecalculationNeeded(adminClient, month, year)

  return {
    rankingData: enhancedRankingData,
    analyticsDetails,
    isMultiSheet,
    previousRanking,
    requiresRecalculation,
  }
}

/**
 * Build the JSON payload(s) to persist after parsing.
 */
export function buildPersistedJson(
  parsed: ParsedRanking,
  filename: string,
  month: number,
  year: number
): BuiltJson {
  const jsonPayload = {
    version: 2,
    filename,
    lastUpdated: new Date().toISOString(),
    totalPlayers: parsed.rankingData.length,
    month,
    year,
    previousRanking: parsed.previousRanking?.filename || null,
    players: parsed.rankingData,
    analyticsFilename: parsed.analyticsDetails.length > 0 ? `${filename}-analytics` : undefined,
  }

  let analyticsPayload: AnalyticsData | undefined
  if (parsed.analyticsDetails.length > 0) {
    analyticsPayload = {
      filename: `${filename}-analytics`,
      rankingFilename: filename,
      month,
      year,
      details: parsed.analyticsDetails,
    }
  }

  return { jsonPayload, analyticsPayload }
}
