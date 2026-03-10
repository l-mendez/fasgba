import { z } from 'zod'

export const profesorSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string().min(1, 'El título es requerido').max(255, 'Título demasiado largo'),
  foto: z.string().max(500).nullable(),
  club_id: z.number().int().positive().nullable(),
  anio_nacimiento: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
  modalidad: z.enum(['presencial', 'virtual', 'ambos']),
  zona: z.string().max(255, 'Zona demasiado larga').nullable(),
  biografia: z.string().nullable(),
})

export const createProfesorSchema = profesorSchema.omit({ id: true })

export const updateProfesorSchema = profesorSchema.omit({ id: true }).partial()

export const profesorIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid profesor ID')
    }
    return num
  }),
})

export function validateCreateProfesor(data: unknown) {
  try {
    return createProfesorSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateUpdateProfesor(data: unknown) {
  try {
    return updateProfesorSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}

export function validateProfesorId(id: string) {
  try {
    return profesorIdSchema.parse({ id }).id
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Invalid profesor ID parameter')
      validationError.name = 'ValidationError'
      throw validationError
    }
    throw error
  }
}
