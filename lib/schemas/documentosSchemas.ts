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

// Schema for updating a document (partial)
export const updateDocumentoSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del documento es requerido')
    .max(255, 'El nombre no puede superar los 255 caracteres')
    .optional(),
  category: z.enum(categoryValues, {
    errorMap: () => ({ message: 'Categoría no válida' }),
  }).optional(),
  sort_order: z.number().int().min(0).optional(),
  importance_level: z.number().int().min(0).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Se requiere al menos un campo para actualizar',
})

// Sort options for documents
export const SORT_OPTIONS = {
  'date-desc': { column: 'created_at', ascending: false, label: 'Fecha (más reciente)' },
  'date-asc': { column: 'created_at', ascending: true, label: 'Fecha (más antiguo)' },
  'alpha-asc': { column: 'name', ascending: true, label: 'Alfabético (A-Z)' },
  'alpha-desc': { column: 'name', ascending: false, label: 'Alfabético (Z-A)' },
  'importance': { column: 'importance_level', ascending: false, label: 'Por importancia' },
  'custom': { column: 'sort_order', ascending: true, label: 'Orden personalizado' },
} as const

export type SortOption = keyof typeof SORT_OPTIONS

const sortOptionValues = Object.keys(SORT_OPTIONS) as [string, ...string[]]

// Schema for query params (list documents)
export const documentoQuerySchema = z.object({
  category: z.enum(categoryValues).optional(),
  sort: z.enum(sortOptionValues).optional().default('custom'),
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
export type UpdateDocumentoInput = z.infer<typeof updateDocumentoSchema>
export type DocumentoQueryInput = z.infer<typeof documentoQuerySchema>
