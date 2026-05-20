export type NotificationType = 'news_created' | 'tournament_created' | 'ranking_updated'

export type NotificationCategory =
  | 'news_fasgba'
  | 'news_club'
  | 'tournament_fasgba'
  | 'tournament_club'
  | 'ranking'

export type BroadcastInput =
  | { type: 'news_created'; newsId: number }
  | { type: 'tournament_created'; tournamentId: number }
  | { type: 'ranking_updated'; rankingMonth: number; rankingYear: number }

export interface EmailContent {
  subject: string
  textContent: string
  htmlContent: string
  category: NotificationCategory
  clubId: number | null
}

export interface NotificationPrefs {
  type?: 'todas' | 'ninguna' | 'personalizar'
  noticias?: 'todos' | 'fasgba-y-clubes' | 'fasgba' | 'clubes' | 'ninguno'
  torneos?: 'todos' | 'fasgba-y-clubes' | 'fasgba' | 'clubes' | 'ninguno'
  ranking?: boolean
}

export type BroadcastStatus = 'sent' | 'no_recipients' | 'error' | 'skipped_duplicate'

export interface BroadcastResult {
  status: BroadcastStatus
  recipientsCount: number
  errorMessage?: string
}
