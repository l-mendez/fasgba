export interface RankingPlayer {
  position: number
  name: string
  title?: string
  club: string
  points: number
  matches: number
  ratings?: {
    standard: number | null
    rapid: number | null
    blitz: number | null
  }
}

export interface PastRanking {
  id: string
  name: string
  displayName?: string
  date: string
  totalPlayers: number
  status: "current" | "archived"
  filePath: string
  size?: number
}

export interface PaginatedPastRankings {
  rankings: PastRanking[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
  nextPage: number | null
}
