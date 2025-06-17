'use client'

// Game interface for display (same as server version)
export interface GameDisplay {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
  fen?: string
  pgn?: string
  date?: string
  time?: string
  // For team tournaments
  whiteTeam?: string
  blackTeam?: string
  // Player IDs for editing
  whitePlayerId?: number
  blackPlayerId?: number
  matchId?: number
}

// Client-side function to fetch tournament games via API
export async function getTournamentGames(tournamentId: number, tournamentType: string = 'individual'): Promise<Record<number, GameDisplay[]>> {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/games?type=${tournamentType}`)
    
    if (!response.ok) {
      console.error('Error fetching tournament games:', response.statusText)
      return {}
    }
    
    const data = await response.json()
    return data.gamesByRound || {}
  } catch (error) {
    console.error('Error fetching tournament games:', error)
    return {}
  }
}

// Client-side function to fetch tournament rounds count via API
export async function getTournamentRounds(tournamentId: number): Promise<number> {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/rounds`)
    
    if (!response.ok) {
      console.error('Error fetching tournament rounds:', response.statusText)
      return 6 // Default fallback
    }
    
    const data = await response.json()
    return data.totalRounds || 6
  } catch (error) {
    console.error('Error fetching tournament rounds:', error)
    return 6 // Default fallback
  }
}

// Client-side function to fetch a specific game by ID via API
export async function getGameById(gameId: number, tournamentType: string = 'individual'): Promise<GameDisplay | null> {
  try {
    const response = await fetch(`/api/games/${gameId}?type=${tournamentType}`)
    
    if (!response.ok) {
      console.error('Error fetching game:', response.statusText)
      return null
    }
    
    const data = await response.json()
    return data.game || null
  } catch (error) {
    console.error('Error fetching game:', error)
    return null
  }
} 