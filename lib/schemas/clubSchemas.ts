import { z } from 'zod'

// Base club schema based on the Club interface
export const clubSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'Club name is required').max(255, 'Club name too long'),
  address: z.string().max(500, 'Address too long').nullable(),
  telephone: z.string().max(50, 'Telephone too long').nullable(),
  mail: z.string().email('Invalid email format').max(255, 'Email too long').nullable(),
  schedule: z.string().max(500, 'Schedule too long').nullable(),
})

// Schema for creating a new club (without id)
export const createClubSchema = clubSchema.omit({ id: true })

// Schema for updating a club (partial, without id)
export const updateClubSchema = clubSchema.omit({ id: true }).partial()

// Schema for club query parameters
export const clubQuerySchema = z.object({
  search: z.string().max(255).optional(),
  hasContact: z.string().transform((val) => val === 'true').optional(),
  include: z.enum(['stats']).optional(),
})

// Schema for club ID parameter
export const clubIdSchema = z.object({
  clubId: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid club ID')
    }
    return num
  }),
})

// Schema for user ID parameter
export const userIdSchema = z.object({
  userId: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid user ID')
    }
    return num
  }),
})

// Schema for club news query parameters
export const clubNewsQuerySchema = z.object({
  limit: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0 || num > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
    return num
  }).optional(),
})

// Validation functions
export function validateCreateClub(data: unknown) {
  try {
    return createClubSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdateClub(data: unknown) {
  try {
    return updateClubSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateClubQuery(searchParams: URLSearchParams) {
  try {
    const params = {
      search: searchParams.get('search') || undefined,
      hasContact: searchParams.get('hasContact') || undefined,
      include: searchParams.get('include') || undefined,
    }
    return clubQuerySchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateClubId(clubId: string) {
  try {
    return clubIdSchema.parse({ clubId }).clubId
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid club ID parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUserId(userId: string) {
  try {
    return userIdSchema.parse({ userId }).userId
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid user ID parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateClubNewsQuery(searchParams: URLSearchParams) {
  try {
    const params = {
      limit: searchParams.get('limit') || undefined,
    }
    return clubNewsQuerySchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
} 