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

// Schema for creating a tournament
export const createTournamentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  time: z.string().max(50, 'Time too long').optional(),
  place: z.string().max(255, 'Place too long').optional(),
  location: z.string().max(255, 'Location too long').optional(),
  rounds: z.number().int().positive('Rounds must be positive').optional(),
  pace: z.string().max(100, 'Pace too long').optional(),
  inscription_details: z.string().max(1000, 'Inscription details too long').optional(),
  cost: z.string().max(255, 'Cost too long').optional(),
  prizes: z.string().max(1000, 'Prizes too long').optional(),
  image: z.string().max(255, 'Image URL too long').optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')).min(1, 'At least one date is required')
})

// Schema for updating a tournament
export const updateTournamentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  time: z.string().max(50, 'Time too long').optional(),
  place: z.string().max(255, 'Place too long').optional(),
  location: z.string().max(255, 'Location too long').optional(),
  rounds: z.number().int().positive('Rounds must be positive').optional(),
  pace: z.string().max(100, 'Pace too long').optional(),
  inscription_details: z.string().max(1000, 'Inscription details too long').optional(),
  cost: z.string().max(255, 'Cost too long').optional(),
  prizes: z.string().max(1000, 'Prizes too long').optional(),
  image: z.string().max(255, 'Image URL too long').optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')).min(1, 'At least one date is required').optional()
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
})

// Schema for single tournament query parameters
export const singleTournamentQuerySchema = z.object({
  format: z.enum(['display', 'raw']).optional().default('raw'),
})

// Validation functions
export function validateTournamentId(id: string) {
  try {
    return tournamentIdSchema.parse({ id }).id
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid tournament ID parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateTournamentQuery(searchParams: URLSearchParams) {
  try {
    const params = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      orderBy: searchParams.get('orderBy') || undefined,
      order: searchParams.get('order') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      format: searchParams.get('format') || undefined,
    }
    
    // Remove undefined values to let defaults apply
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    )
    
    return tournamentQuerySchema.parse(cleanParams)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateSingleTournamentQuery(searchParams: URLSearchParams) {
  try {
    const params = {
      format: searchParams.get('format') || undefined,
    }
    
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    )
    
    return singleTournamentQuerySchema.parse(cleanParams)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateCreateTournament(data: any) {
  try {
    return createTournamentSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdateTournament(data: any) {
  try {
    return updateTournamentSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
} 