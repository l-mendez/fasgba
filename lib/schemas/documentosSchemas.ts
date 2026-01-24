import { z } from 'zod'
import { DOCUMENT_CATEGORIES } from '@/lib/documentosUtils'

// Valid category values
const categoryValues = Object.keys(DOCUMENT_CATEGORIES) as [string, ...string[]]

// Schema for document ID (from URL params)
export const documentoIdSchema = z.string().transform((val, ctx) => {
  const num = parseInt(val, 10)
  if (isNaN(num) || num <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El ID del documento debe ser un número positivo',
    })
    return z.NEVER
  }
  return num
})

// Schema for creating a document (used in upload)
export const createDocumentoSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del documento es requerido')
    .max(255, 'El nombre no puede superar los 255 caracteres'),
  category: z.enum(categoryValues, {
    errorMap: () => ({ message: 'Categoría no válida' }),
  }),
})

// Schema for query params (list documents)
export const documentoQuerySchema = z.object({
  category: z.enum(categoryValues).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1
      const num = parseInt(val, 10)
      if (isNaN(num) || num <= 0) return 1
      return num
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20
      const num = parseInt(val, 10)
      if (isNaN(num) || num <= 0 || num > 100) return 20
      return num
    }),
})

// Type exports
export type CreateDocumentoInput = z.infer<typeof createDocumentoSchema>
export type DocumentoQueryInput = z.infer<typeof documentoQuerySchema>
