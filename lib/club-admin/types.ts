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
