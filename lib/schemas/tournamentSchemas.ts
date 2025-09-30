import { z } from 'zod'
import { API_CONSTANTS } from '@/lib/utils/constants'

// Schema for tournament ID parameter
export const tournamentIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid tournament ID')
    }
    return num
  }),
})

// Schema for creating tournaments
export const createTournamentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  time: z.string().max(100, 'Time too long').optional(),
  place: z.string().max(255, 'Place too long').optional(),
  location: z.string().max(500, 'Location too long').optional(),
  rounds: z.number().int().min(1, 'Rounds must be at least 1').max(20, 'Too many rounds').optional(),
  pace: z.string().max(100, 'Pace too long').optional(),
  inscription_details: z.string().max(2000, 'Inscription details too long').optional(),
  cost: z.string().max(255, 'Cost too long').optional(),
  prizes: z.string().max(1000, 'Prizes too long').optional(),
  registration_link: z.string().url('Invalid registration link URL').optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')).min(1, 'At least one date is required'),
  created_by_club: z.number().int().positive('Invalid club ID').optional(),
  // New fields
  tournament_type: z.enum(['individual', 'team']).default('individual'),
  players_per_team: z.number().int().min(1, 'Players per team must be at least 1').max(20, 'Too many players per team').optional(),
  max_teams: z.number().int().min(2, 'Max teams must be at least 2').max(100, 'Too many teams').optional(),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  team_match_points: z.record(z.string(), z.number()).optional(),
})

// Schema for updating tournaments (all fields optional except dates array validation)
export const updateTournamentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  time: z.string().max(100, 'Time too long').optional(),
  place: z.string().max(255, 'Place too long').optional(),
  location: z.string().max(500, 'Location too long').optional(),
  rounds: z.number().int().min(1, 'Rounds must be at least 1').max(20, 'Too many rounds').optional(),
  pace: z.string().max(100, 'Pace too long').optional(),
  inscription_details: z.string().max(2000, 'Inscription details too long').optional(),
  cost: z.string().max(255, 'Cost too long').optional(),
  prizes: z.string().max(1000, 'Prizes too long').optional(),
  registration_link: z.string().url('Invalid registration link URL').optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')).min(1, 'At least one date is required').optional(),
  created_by_club: z.number().int().positive('Invalid club ID').optional(),
  // New fields
  tournament_type: z.enum(['individual', 'team']).optional(),
  players_per_team: z.number().int().min(1, 'Players per team must be at least 1').max(20, 'Too many players per team').optional(),
  max_teams: z.number().int().min(2, 'Max teams must be at least 2').max(100, 'Too many teams').optional(),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  team_match_points: z.record(z.string(), z.number()).optional(),
})

// Schema for tournament query parameters
export const tournamentQuerySchema = z.object({
  page: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Page must be a positive number')
    }
    return num
  }).optional().default('1'),
  
  limit: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0 || num > API_CONSTANTS.MAX_PAGE_SIZE) {
      throw new Error(`Limit must be between 1 and ${API_CONSTANTS.MAX_PAGE_SIZE}`)
    }
    return num
  }).optional().default(String(API_CONSTANTS.DEFAULT_PAGE_SIZE)),
  
  orderBy: z.enum(API_CONSTANTS.TOURNAMENT_ORDER_BY).optional().default('start_date'),
  
  order: z.enum(API_CONSTANTS.SORT_ORDERS).optional().default('asc'),
  
  status: z.enum(API_CONSTANTS.TOURNAMENT_STATUSES).optional().default('all'),
  
  search: z.string().max(255, 'Search term too long').optional(),
  
  format: z.enum(API_CONSTANTS.TOURNAMENT_FORMATS).optional().default('raw'),
  
  // New filter for tournament type
  tournament_type: z.enum(['individual', 'team', 'all']).optional().default('all'),
})

// Schema for single tournament query parameters
export const singleTournamentQuerySchema = z.object({
  format: z.enum(['display', 'raw']).optional().default('raw'),
})

// Validation functions
export function validateTournamentId(id: string): number {
  const result = tournamentIdSchema.safeParse({ id })
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message || 'Invalid tournament ID')
  }
  return result.data.id
}

export function validateCreateTournament(data: unknown) {
  const result = createTournamentSchema.safeParse(data)
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Validation error: ${errorMessage}`)
  }
  return result.data
}

export function validateUpdateTournament(data: unknown) {
  const result = updateTournamentSchema.safeParse(data)
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Validation error: ${errorMessage}`)
  }
  return result.data
}

export function validateTournamentQuery(searchParams: URLSearchParams) {
  const params = Object.fromEntries(searchParams.entries())
  const result = tournamentQuerySchema.safeParse(params)
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Query validation error: ${errorMessage}`)
  }
  return result.data
}

export function validateSingleTournamentQuery(searchParams: URLSearchParams) {
  const params = Object.fromEntries(searchParams.entries())
  const result = singleTournamentQuerySchema.safeParse(params)
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Query validation error: ${errorMessage}`)
  }
  return result.data
}

// Type exports
export type CreateTournamentData = z.infer<typeof createTournamentSchema>
export type UpdateTournamentData = z.infer<typeof updateTournamentSchema>
export type TournamentQueryParams = z.infer<typeof tournamentQuerySchema>
export type SingleTournamentQueryParams = z.infer<typeof singleTournamentQuerySchema> 