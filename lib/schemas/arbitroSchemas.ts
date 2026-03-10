import { z } from 'zod'

export const arbitroSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Nombre demasiado largo'),
  title: z.string().min(1, 'El título es requerido').max(255, 'Título demasiado largo'),
  photo: z.string().nullable(),
  club_id: z.number().int().positive().nullable(),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
  bio: z.string().max(2000, 'La reseña es demasiado larga').nullable(),
})

export const createArbitroSchema = arbitroSchema.omit({ id: true })

export const updateArbitroSchema = arbitroSchema.omit({ id: true }).partial()

export const arbitroIdSchema = z.object({
  arbitroId: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid arbitro ID')
    }
    return num
  }),
})

export function validateCreateArbitro(data: unknown) {
  try {
    return createArbitroSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdateArbitro(data: unknown) {
  try {
    return updateArbitroSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateArbitroId(arbitroId: string) {
  try {
    return arbitroIdSchema.parse({ arbitroId }).arbitroId
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid arbitro ID parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}
