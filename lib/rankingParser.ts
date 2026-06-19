// Thin re-export barrel. Implementation lives under lib/ranking/.
export type {
  ExcelPlayer,
  RankingPlayer,
  PreviousPlayer,
  ParsedRanking,
  BuiltJson,
  RankingUploadResult,
} from '@/lib/ranking/types'

export { parseWorkbook, buildPersistedJson } from '@/lib/ranking/parser'
