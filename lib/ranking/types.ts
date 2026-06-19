import type {
  PlayerRatings,
  TournamentDetail,
  AnalyticsData,
} from '@/lib/rankingUtils'

export interface ExcelPlayer {
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

export interface RankingPlayer {
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

export interface PreviousPlayer {
  position: number;
  name: string;
  id?: string;
  points: number;
  ratings?: PlayerRatings;
}

export interface ParsedRanking {
  rankingData: RankingPlayer[]
  analyticsDetails: TournamentDetail[]
  isMultiSheet: boolean
  previousRanking: { filename: string; players: any[] } | null
  requiresRecalculation: boolean
}

export interface BuiltJson {
  jsonPayload: {
    version: number
    filename: string
    lastUpdated: string
    totalPlayers: number
    month: number
    year: number
    previousRanking: string | null
    players: RankingPlayer[]
    analyticsFilename?: string
  }
  analyticsPayload?: AnalyticsData
}

export interface RankingUploadResult {
  filename: string
  totalPlayers: number
  previewData: RankingPlayer[]
  tempJsonPath: string
  tempAnalyticsPath?: string
  isMultiSheet: boolean
  hasAnalytics: boolean
  analyticsCount: number
  requiresRecalculation: boolean
}
