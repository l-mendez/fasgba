import type { DocumentCategory, DocumentoSummary } from "@/lib/documentosUtils"

export interface Documento extends DocumentoSummary {
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
