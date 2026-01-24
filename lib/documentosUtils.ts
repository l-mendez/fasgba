import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Document categories with Spanish labels
export const DOCUMENT_CATEGORIES = {
  reglamentos: 'Reglamentos',
  actas: 'Actas',
  circulares: 'Minutas',
  otros: 'Otros',
} as const

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES

// Category colors for badges
export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  reglamentos: 'bg-blue-100 text-blue-800',
  actas: 'bg-green-100 text-green-800',
  circulares: 'bg-amber-100 text-amber-800',
  otros: 'bg-gray-100 text-gray-800',
}

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME type
export const ALLOWED_MIME_TYPE = 'application/pdf'

/**
 * Get public URL for a document stored in Supabase Storage
 */
export function getDocumentUrl(filePath: string | null): string | null {
  if (!filePath) return null

  if (filePath.startsWith('http')) {
    return filePath
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data } = supabase.storage
    .from('documentos')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A'

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get Argentina time formatted date
 */
export function formatArgentinaDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  })
}

/**
 * Get Argentina time formatted date (short format)
 */
export function formatArgentinaDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  })
}

/**
 * Extract filename without extension from a file path or File object
 */
export function extractDocumentName(file: File | string): string {
  const filename = typeof file === 'string' ? file : file.name
  // Remove extension and replace dashes/underscores with spaces
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  return nameWithoutExt.replace(/[-_]/g, ' ')
}

/**
 * Validate if a file is a valid PDF
 */
export function isValidPdf(file: File): { valid: boolean; error?: string } {
  if (file.type !== ALLOWED_MIME_TYPE) {
    return { valid: false, error: 'Solo se permiten archivos PDF' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo no puede superar los 10MB' }
  }

  return { valid: true }
}

/**
 * Generate a unique filename for storage
 */
export function generateStorageFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitizedName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')

  return `${timestamp}-${random}-${sanitizedName}`
}

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): category is DocumentCategory {
  return category in DOCUMENT_CATEGORIES
}
