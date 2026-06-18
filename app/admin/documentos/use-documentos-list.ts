"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { apiCall } from "@/lib/utils/apiClient"
import { type SortOption } from "@/lib/schemas/documentosSchemas"
import {
  DOCUMENTS_PAGE_SIZE,
  type Documento,
  type DocumentosResponse,
} from "./types"

interface UseDocumentosListOptions {
  initialDocuments: Documento[]
  initialTotalDocuments: number
  setErrorMessage: (message: string) => void
  setSuccessMessage: (message: string) => void
}

/**
 * Owns the documents list: fetching, infinite-scroll pagination, drag/move
 * reordering and persisting custom order. Rename/delete/upload mutations live in
 * the client but use the exposed setters to keep local state in sync.
 */
export function useDocumentosList({
  initialDocuments,
  initialTotalDocuments,
  setErrorMessage,
  setSuccessMessage,
}: UseDocumentosListOptions) {
  const [documents, setDocuments] = useState<Documento[]>(initialDocuments)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalDocuments, setTotalDocuments] = useState(initialTotalDocuments)
  const [currentPage, setCurrentPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const hasUsedInitialDocumentsRef = useRef(false)

  const [sortOption, setSortOption] = useState<SortOption>("custom")
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [hasOrderChanges, setHasOrderChanges] = useState(false)

  const fetchDocumentsPage = useCallback(
    async (page: number): Promise<DocumentosResponse> => {
      return apiCall(`/api/documentos?limit=${DOCUMENTS_PAGE_SIZE}&page=${page}&sort=${sortOption}`)
    },
    [sortOption]
  )

  const loadDocuments = useCallback(async (options?: { ensureDocumentId?: number }) => {
    setIsLoading(true)
    try {
      const firstPage = await fetchDocumentsPage(1)
      const total = firstPage.total || 0
      let loadedDocuments = firstPage.documentos || []
      let loadedPage = 1

      while (
        options?.ensureDocumentId &&
        loadedDocuments.length < total &&
        !loadedDocuments.some((documento) => documento.id === options.ensureDocumentId)
      ) {
        loadedPage += 1
        const nextPage = await fetchDocumentsPage(loadedPage)
        loadedDocuments = [...loadedDocuments, ...(nextPage.documentos || [])]
      }

      setDocuments(loadedDocuments)
      setTotalDocuments(total)
      setCurrentPage(loadedPage)
      setHasOrderChanges(false)
    } catch (error) {
      console.error("Error loading documents:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error de conexión al cargar documentos"
      )
    } finally {
      setIsLoading(false)
    }
  }, [fetchDocumentsPage, setErrorMessage])

  // Load documents on mount or when sort changes
  useEffect(() => {
    if (!hasUsedInitialDocumentsRef.current) {
      hasUsedInitialDocumentsRef.current = true
      return
    }

    loadDocuments()
  }, [loadDocuments])

  const loadMoreDocuments = useCallback(async () => {
    if (isLoading || isLoadingMore || documents.length >= totalDocuments) return

    setIsLoadingMore(true)
    setErrorMessage("")

    try {
      const nextPage = currentPage + 1
      const result = await fetchDocumentsPage(nextPage)
      const nextDocuments = result.documentos || []

      setDocuments((prev) => [...prev, ...nextDocuments])
      setTotalDocuments(result.total || totalDocuments)
      setCurrentPage(nextPage)
    } catch (error) {
      console.error("Error loading more documents:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error de conexión al cargar más documentos"
      )
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    currentPage,
    documents.length,
    fetchDocumentsPage,
    isLoading,
    isLoadingMore,
    setErrorMessage,
    totalDocuments,
  ])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || isLoading || isLoadingMore || documents.length >= totalDocuments) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreDocuments()
        }
      },
      { rootMargin: "240px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [documents.length, isLoading, isLoadingMore, loadMoreDocuments, totalDocuments])

  // Drag and drop reordering (desktop)
  const handleRowDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRowDragEnd = () => {
    setDraggedId(null)
  }

  const handleRowDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (draggedId === null || draggedId === targetId) return

    const draggedIndex = documents.findIndex((d) => d.id === draggedId)
    const targetIndex = documents.findIndex((d) => d.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newDocuments = [...documents]
    const [draggedItem] = newDocuments.splice(draggedIndex, 1)
    newDocuments.splice(targetIndex, 0, draggedItem)

    setDocuments(newDocuments)
    setHasOrderChanges(true)
  }

  // Move up/down for mobile reordering
  const moveDocument = (id: number, direction: "up" | "down") => {
    const currentIndex = documents.findIndex((d) => d.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= documents.length) return

    const newDocuments = [...documents]
    const [movedItem] = newDocuments.splice(currentIndex, 1)
    newDocuments.splice(newIndex, 0, movedItem)

    setDocuments(newDocuments)
    setHasOrderChanges(true)
  }

  const saveCustomOrder = async () => {
    setIsSavingOrder(true)
    setErrorMessage("")

    try {
      const totalPages = Math.ceil(totalDocuments / DOCUMENTS_PAGE_SIZE)
      const remainingPages = Array.from(
        { length: Math.max(totalPages - currentPage, 0) },
        (_, index) => currentPage + index + 1
      )
      const remainingResults = await Promise.all(
        remainingPages.map((page) => fetchDocumentsPage(page))
      )
      const documentsToSave = [
        ...documents,
        ...remainingResults.flatMap((result) => result.documentos || []),
      ]
      const documentIds = documentsToSave.map((d) => d.id)

      await apiCall("/api/admin/documentos/reorder", {
        method: "POST",
        body: JSON.stringify({ documentIds }),
      })

      setDocuments(documentsToSave)
      setCurrentPage(Math.max(totalPages, currentPage))
      setSuccessMessage("Orden guardado exitosamente")
      setHasOrderChanges(false)
    } catch (error) {
      console.error("Save order error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error al guardar el orden"
      )
    } finally {
      setIsSavingOrder(false)
    }
  }

  const hasMoreDocuments = documents.length < totalDocuments

  return {
    documents,
    setDocuments,
    totalDocuments,
    setTotalDocuments,
    isLoading,
    isLoadingMore,
    sortOption,
    setSortOption,
    draggedId,
    isSavingOrder,
    hasOrderChanges,
    loadMoreRef,
    hasMoreDocuments,
    loadDocuments,
    loadMoreDocuments,
    handleRowDragStart,
    handleRowDragEnd,
    handleRowDragOver,
    moveDocument,
    saveCustomOrder,
  }
}
