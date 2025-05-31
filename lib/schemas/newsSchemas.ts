import { z } from 'zod'

// Schema for news ID validation
export const newsIdSchema = z.string().transform((val) => {
  const num = parseInt(val, 10)
  if (isNaN(num) || num <= 0) {
    throw new Error('News ID must be a positive integer')
  }
  return num
})

// Schema for creating a new news item
export const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  extract: z.string().max(500, 'Extract must be less than 500 characters').optional(),
  text: z.string().min(1, 'Content is required'),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  club_id: z.number().int().positive('Club ID must be a positive integer').optional(),
})

// Schema for updating a news item
export const updateNewsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  extract: z.string().max(500, 'Extract must be less than 500 characters').optional(),
  text: z.string().min(1, 'Content is required').optional(),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  club_id: z.number().int().positive('Club ID must be a positive integer').optional(),
})

// Schema for news query parameters
export const newsQuerySchema = z.object({
  page: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Page must be a positive integer')
    }
    return num
  }).optional(),
  limit: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0 || num > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
    return num
  }).optional(),
  orderBy: z.enum(['date', 'title', 'created_at', 'updated_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().max(255, 'Search query must be less than 255 characters').optional(),
  clubId: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Club ID must be a positive integer')
    }
    return num
  }).optional(),
  authorId: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Author ID must be a positive integer')
    }
    return num
  }).optional(),
  tags: z.string().transform((val) => {
    try {
      const parsed = JSON.parse(val)
      if (!Array.isArray(parsed)) {
        throw new Error('Tags must be an array')
      }
      return parsed
    } catch {
      // If not JSON, treat as comma-separated values
      return val.split(',').map(tag => tag.trim()).filter(Boolean)
    }
  }).optional(),
  include: z.string().transform((val) => {
    const includes = val.split(',').map(i => i.trim())
    const validIncludes = ['author', 'club']
    const invalidIncludes = includes.filter(i => !validIncludes.includes(i))
    if (invalidIncludes.length > 0) {
      throw new Error(`Invalid include values: ${invalidIncludes.join(', ')}. Valid values are: ${validIncludes.join(', ')}`)
    }
    return includes as Array<'author' | 'club'>
  }).optional(),
})

// Validation functions
export function validateNewsId(id: string): number {
  try {
    return newsIdSchema.parse(id)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`News ID validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateCreateNews(data: unknown) {
  try {
    return createNewsSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Create news validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdateNews(data: unknown) {
  try {
    return updateNewsSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Update news validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateNewsQuery(searchParams: URLSearchParams) {
  try {
    const params = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      orderBy: searchParams.get('orderBy') || undefined,
      order: searchParams.get('order') || undefined,
      search: searchParams.get('search') || undefined,
      clubId: searchParams.get('clubId') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      tags: searchParams.get('tags') || undefined,
      include: searchParams.get('include') || undefined,
    }
    return newsQuerySchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
} 