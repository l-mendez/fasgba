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
  Trash2,
  X,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  CATEGORY_COLORS,
  DOCUMENT_CATEGORIES,
  formatArgentinaDate,
  formatFileSize,
  getDocumentUrl,
} from "@/lib/documentosUtils"
import { SORT_OPTIONS, type SortOption } from "@/lib/schemas/documentosSchemas"
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
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const openDocument = (documento: Documento) => {
    const url = getDocumentUrl(documento.file_path)
    if (url) {
      window.open(url, "_blank")
    }
  }

  const downloadDocument = (documento: Documento) => {
    const url = getDocumentUrl(documento.file_path)
    if (url) {
      const link = document.createElement("a")
      link.href = url
      const ext = documento.file_path?.split('.').pop() || 'pdf'
      link.download = `${documento.name}.${ext}`
      link.click()
    }
  }

  const getDocumentIcon = (documento: Documento) => {
    const ext = documento.file_path?.split('.').pop()?.toLowerCase()
    if (ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />
    }
    return <FileText className="h-4 w-4 text-red-500" />
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

      setSuccessMessage("Nombre actualizado exitosamente")
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

  const handleDelete = async (documento: Documento) => {
    setDeletingId(documento.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const result = await apiCall(`/api/admin/documentos/${documento.id}`, {
        method: "DELETE",
      })

      setDocuments((prev) => prev.filter((d) => d.id !== documento.id))
      setTotalDocuments((total) => Math.max(total - 1, 0))

      setSuccessMessage(result.message || "Documento eliminado exitosamente")
    } catch (error) {
      console.error("Delete error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido al eliminar el documento"
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Documentos existentes</CardTitle>
            <CardDescription>
              Gestiona los documentos publicados en la biblioteca
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-select" className="text-sm whitespace-nowrap">
              Ordenar por:
            </Label>
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
        {sortOption === "custom" && hasOrderChanges && (
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
              Tienes cambios sin guardar
            </span>
          </div>
        )}
        {sortOption === "custom" && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="hidden sm:inline">Arrastra las filas para reordenar los documentos</span>
            <span className="sm:hidden">Usa las flechas para reordenar los documentos</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando documentos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                Mostrando {documents.length} de {totalDocuments} documento
                {totalDocuments !== 1 ? "s" : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  {sortOption === "custom" && <TableHead className="w-10"></TableHead>}
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Tamaño</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((documento) => (
                  <TableRow
                    key={documento.id}
                    draggable={sortOption === "custom"}
                    onDragStart={(e) => handleRowDragStart(e, documento.id)}
                    onDragEnd={handleRowDragEnd}
                    onDragOver={(e) => handleRowDragOver(e, documento.id)}
                    className={`${
                      sortOption === "custom" ? "cursor-move" : ""
                    } ${
                      draggedId === documento.id ? "opacity-50" : ""
                    }`}
                  >
                    {sortOption === "custom" && (
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
                              disabled={documents.findIndex((d) => d.id === documento.id) === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveDocument(documento.id, "down")}
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
                            disabled={isRenaming}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getDocumentIcon(documento)}
                          <span>{documento.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[documento.category]}
                      >
                        {DOCUMENT_CATEGORIES[documento.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatArgentinaDate(documento.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatFileSize(documento.file_size)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => startEditing(documento)}
                          title="Renombrar documento"
                          disabled={editingId !== null}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Renombrar documento</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openDocument(documento)}
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver documento</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => downloadDocument(documento)}
                          title="Descargar documento"
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar documento</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deletingId === documento.id}
                            >
                              {deletingId === documento.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">Eliminar documento</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar documento?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente el documento
                                &quot;{documento.name}&quot;. Esta acción no se puede
                                deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(documento)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No se encontraron documentos</p>
                <p className="text-sm">Sube el primer documento usando el formulario de arriba</p>
              </div>
            )}

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
                    "Cargar más documentos"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
