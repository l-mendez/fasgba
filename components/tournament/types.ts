export interface Round {
  id: number
  round_number: number
}

export interface Team {
  id: number
  name: string
}

export interface Player {
  id: number
  full_name: string
  fide_id?: string
  rating?: number
  team?: {
    id: number
    name: string
  }
  club?: {
    id: number
    name: string
  }
}

export interface Match {
  id: number
  team_a: { id: number; name: string }
  team_b: { id: number; name: string }
}

export interface GameFormData {
  white_player_id: number
  black_player_id: number
  board_number?: number
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  pgn?: string
  game_date?: string
  game_time?: string
  match_id?: number
}
