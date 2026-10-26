"use client"

import { Dispatch, SetStateAction, useState } from "react"
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions } from "@/components/admin-row-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiCall } from "@/lib/utils/apiClient"
import { openDocumento } from "@/lib/documentos-client"
import {
  DOCUMENT_CATEGORIES,
  formatArgentinaDate,
  formatFileSize,
  getDocumentoExtension,
  isSpreadsheetExtension,
} from "@/lib/documentosUtils"
import { SORT_OPTIONS, type SortOption } from "@/lib/schemas/documentosSchemas"
import { CategoryPill } from "./category-pill"
import type { Documento } from "./types"

interface DocumentosTableProps {
  documents: Documento[]
  totalDocuments: number
  isLoading: boolean
  sortOption: SortOption
  setSortOption: (value: SortOption) => void
  isSavingOrder: boolean
  hasOrderChanges: boolean
  saveCustomOrder: () => Promise<void> | void
  draggedId: number | null
  handleRowDragStart: (e: React.DragEvent, id: number) => void
  handleRowDragEnd: () => void
  handleRowDragOver: (e: React.DragEvent, targetId: number) => void
  moveDocument: (id: number, direction: "up" | "down") => void
  hasMoreDocuments: boolean
  isLoadingMore: boolean
  loadMoreDocuments: () => Promise<void> | void
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  setDocuments: Dispatch<SetStateAction<Documento[]>>
  setTotalDocuments: Dispatch<SetStateAction<number>>
  setErrorMessage: (message: string) => void
  setSuccessMessage: (message: string) => void
}

export function DocumentosTable({
  documents,
  totalDocuments,
  isLoading,
  sortOption,
  setSortOption,
  isSavingOrder,
  hasOrderChanges,
  saveCustomOrder,
  draggedId,
  handleRowDragStart,
  handleRowDragEnd,
  handleRowDragOver,
  moveDocument,
  hasMoreDocuments,
  isLoadingMore,
  loadMoreDocuments,
  loadMoreRef,
  setDocuments,
  setTotalDocuments,
  setErrorMessage,
  setSuccessMessage,
}: DocumentosTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Documento | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const query = searchTerm.trim().toLowerCase()
  const visibleDocuments = query
    ? documents.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          (DOCUMENT_CATEGORIES[d.category] ?? d.category).toLowerCase().includes(query)
      )
    : documents
  // Reordering only makes sense on the full, unfiltered list.
  const canReorder = sortOption === "custom" && !query

  const openDocument = (documento: Documento) =>
    openDocumento(documento, "view").catch((err) => setErrorMessage(err.message))

  const downloadDocument = (documento: Documento) =>
    openDocumento(documento, "download").catch((err) => setErrorMessage(err.message))

  const getDocumentIcon = (documento: Documento) => {
    if (isSpreadsheetExtension(getDocumentoExtension(documento.file_path))) {
      return <FileSpreadsheet className="h-4 w-4 shrink-0 text-amber" />
    }
    return <FileText className="h-4 w-4 shrink-0 text-terracotta" />
  }

  const startEditing = (documento: Documento) => {
    setEditingId(documento.id)
    setEditingName(documento.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName("")
  }

  const saveRename = async (id: number) => {
    if (!editingName.trim()) {
      setErrorMessage("El nombre no puede estar vacío")
      return
    }

    setIsRenaming(true)
    setErrorMessage("")

    try {
      await apiCall(`/api/admin/documentos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingName.trim() }),
      })

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: editingName.trim() } : d))
      )

      setSuccessMessage("Nombre actualizado")
      cancelEditing()
    } catch (error) {
      console.error("Rename error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error al renombrar el documento"
      )
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    const documento = deleteTarget
    if (!documento) return
    setIsDeleting(true)

    try {
      const result = await apiCall(`/api/admin/documentos/${documento.id}`, {
        method: "DELETE",
      })

      setDocuments((prev) => prev.filter((d) => d.id !== documento.id))
      setTotalDocuments((total) => Math.max(total - 1, 0))

      setSuccessMessage(result.message || "Documento eliminado")
    } catch (error) {
      console.error("Delete error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error al eliminar el documento"
      )
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Documentos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:w-[260px]"
                aria-label="Buscar documentos"
              />
            </div>
            <Label htmlFor="sort-select" className="sr-only">Ordenar por</Label>
            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as SortOption)}
            >
              <SelectTrigger id="sort-select" className="w-[200px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {canReorder && hasOrderChanges && (
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={saveCustomOrder}
              disabled={isSavingOrder}
              size="sm"
            >
              {isSavingOrder ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar orden
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              Cambios sin guardar
            </span>
          </div>
        )}
        {canReorder && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="hidden sm:inline">Arrastra las filas para reordenar</span>
            <span className="sm:hidden">Usa las flechas para reordenar</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Cargando documentos</span>
          </div>
        ) : visibleDocuments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {query ? "No se encontraron documentos" : "No hay documentos"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              {!query && (
                <TableCaption>
                  Mostrando {documents.length} de {totalDocuments}{" "}
                  {totalDocuments === 1 ? "documento" : "documentos"}
                </TableCaption>
              )}
              <TableHeader>
                <TableRow>
                  {canReorder && <TableHead className="w-10"></TableHead>}
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Tamaño</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDocuments.map((documento) => (
                  <TableRow
                    key={documento.id}
                    draggable={canReorder}
                    onDragStart={(e) => handleRowDragStart(e, documento.id)}
                    onDragEnd={handleRowDragEnd}
                    onDragOver={(e) => handleRowDragOver(e, documento.id)}
                    className={`${
                      canReorder ? "cursor-move" : ""
                    } ${
                      draggedId === documento.id ? "opacity-50" : ""
                    }`}
                  >
                    {canReorder && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Desktop: drag handle */}
                          <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
                          {/* Mobile: up/down buttons */}
                          <div className="flex flex-col sm:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveDocument(documento.id, "up")}
                              aria-label="Subir"
                              title="Subir"
                              disabled={documents.findIndex((d) => d.id === documento.id) === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveDocument(documento.id, "down")}
                              aria-label="Bajar"
                              title="Bajar"
                              disabled={documents.findIndex((d) => d.id === documento.id) === documents.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {editingId === documento.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 w-full max-w-[200px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(documento.id)
                              if (e.key === "Escape") cancelEditing()
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => saveRename(documento.id)}
                            aria-label="Guardar nombre"
                            title="Guardar nombre"
                            disabled={isRenaming}
                          >
                            {isRenaming ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={cancelEditing}
                            aria-label="Cancelar"
                            title="Cancelar"
                            disabled={isRenaming}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getDocumentIcon(documento)}
                          <span className="min-w-0 break-words">{documento.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <CategoryPill category={documento.category} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 text-amber" />
                        {formatArgentinaDate(documento.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-sm lg:table-cell">
                      {formatFileSize(documento.file_size)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminRowActions
                        actions={[
                          {
                            label: "Ver",
                            icon: Eye,
                            onSelect: () => openDocument(documento),
                          },
                          {
                            label: "Descargar",
                            icon: Download,
                            onSelect: () => downloadDocument(documento),
                          },
                          {
                            label: "Renombrar",
                            icon: Pencil,
                            onSelect: () => startEditing(documento),
                            disabled: editingId !== null,
                          },
                          {
                            label: "Eliminar",
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setDeleteTarget(documento),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasMoreDocuments && (
              <div ref={loadMoreRef} className="flex justify-center py-6">
                <Button
                  variant="outline"
                  onClick={loadMoreDocuments}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Cargar más"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar documento?"
        description={`Se eliminará "${deleteTarget?.name ?? ""}". Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        pending={isDeleting}
      />
    </Card>
  )
}
