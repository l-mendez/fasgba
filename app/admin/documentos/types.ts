import type { DocumentCategory } from "@/lib/documentosUtils"

export interface Documento {
  id: number
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  file_type?: string | null
  sort_order?: number
  importance_level?: number
  created_at: string
}

export type CategoryImportance = Record<DocumentCategory, number>

export interface DocumentosResponse {
  documentos?: Documento[]
  total?: number
}

export const DOCUMENTS_PAGE_SIZE = 100
