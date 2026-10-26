export interface ClubAdminClub {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

export interface ClubAdminStats {
  noticias: number
  torneos: number
  torneosActivos: number
  seguidores: number
  crecimientoSeguidores: number
}

export interface ClubAdminActivityItem {
  type: "news" | "tournament" | "follower"
  title: string
  date: string
  description?: string
  author?: string
}

export interface ClubAdminPlayer {
  id: number
  full_name: string
  fide_id: string | null
  rating: number | null
  club: {
    id: number
    name: string
  } | null
}

export interface ClubAdminTeam {
  id: number
  name: string
  club_id: number
  created_at?: string | null
}

/** Cookie that remembers the club picked in the club-admin selector. */
export const SELECTED_CLUB_COOKIE = "club_admin_club"

export const CLUB_PLAYERS_PAGE_SIZE = 25

/** "none" lists players without a club (club admins may claim them). */
export type ClubPlayersScope = number | "none"

export interface ClubPlayersPage {
  players: ClubAdminPlayer[]
  total: number
}
