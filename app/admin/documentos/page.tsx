"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { createClient } from "@/lib/supabase/client"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
  formatFileSize,
  formatArgentinaDate,
  getDocumentUrl,
  extractDocumentName,
  isValidPdf,
  type DocumentCategory,
} from "@/lib/documentosUtils"

interface Documento {
  id: number
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  created_at: string
}

export default function AdminDocumentosPage() {
  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("otros")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Documents list state
  const [documents, setDocuments] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Messages state
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setErrorMessage("Sesión no válida. Por favor, inicia sesión nuevamente.")
        return
      }

      const response = await fetch("/api/documentos?limit=100", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setDocuments(result.documentos || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setErrorMessage(
          `Error al cargar los documentos (${response.status}). ${errorData.error || "Verifica tu conexión e intenta nuevamente."}`
        )
      }
    } catch (error) {
      console.error("Error loading documents:", error)
      setErrorMessage("Error de conexión al cargar documentos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    const validation = isValidPdf(selectedFile)

    if (!validation.valid) {
      setErrorMessage(validation.error || "Archivo no válido")
      return
    }

    setFile(selectedFile)
    setDocumentName(extractDocumentName(selectedFile))
    setErrorMessage("")
    setSuccessMessage("")
  }

  const handleUpload = async () => {
    if (!file || !documentName.trim()) {
      setErrorMessage("Por favor, selecciona un archivo y proporciona un nombre")
      return
    }

    setIsUploading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", documentName.trim())
      formData.append("category", category)

      const response = await fetch("/api/admin/documentos/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error del servidor (${response.status})`)
      }

      const result = await response.json()

      // Reset form
      setFile(null)
      setDocumentName("")
      setCategory("otros")

      // Show success message
      setSuccessMessage(result.message || "Documento subido exitosamente")

      // Reload documents list
      await loadDocuments()
    } catch (error) {
      console.error("Upload error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido al subir el documento"
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documento: Documento) => {
    setDeletingId(documento.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Sesión no válida")
      }

      const response = await fetch(`/api/admin/documentos/${documento.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error del servidor (${response.status})`)
      }

      const result = await response.json()

      // Remove from local state
      setDocuments(documents.filter((d) => d.id !== documento.id))

      // Show success message
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

  const handleClearFile = () => {
    setFile(null)
    setDocumentName("")
    setErrorMessage("")
  }

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
      link.download = `${documento.name}.pdf`
      link.click()
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Gestión de Documentos
        </h2>
        <Badge variant="outline" className="w-fit">
          <FileText className="mr-1 h-3 w-3" />
          Solo archivos PDF
        </Badge>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          variant="default"
          className="border-green-200 bg-green-50 text-green-800"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subir documento</CardTitle>
          <CardDescription>
            Selecciona un archivo PDF para subir a la biblioteca de documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-select">Categoría</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as DocumentCategory)}
              >
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {file && (
              <div className="space-y-2">
                <Label htmlFor="document-name">Nombre del documento</Label>
                <Input
                  id="document-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Nombre del documento"
                  maxLength={255}
                />
              </div>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {file ? file.name : "Arrastra tu archivo aquí o haz clic para seleccionar"}
              </p>
              <p className="text-sm text-muted-foreground">
                Solo archivos PDF (máximo 10MB)
              </p>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Tamaño: {formatFileSize(file.size)}
                </p>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <div className="flex gap-2 justify-center mt-4">
              <Button asChild variant="outline" disabled={isUploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Seleccionar archivo
                </label>
              </Button>
              {file && (
                <Button variant="ghost" onClick={handleClearFile} disabled={isUploading}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Upload Button */}
          {file && (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !documentName.trim()}
                className="flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir documento
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos existentes</CardTitle>
          <CardDescription>
            Gestiona los documentos publicados en la biblioteca
          </CardDescription>
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
                  {documents.length} documento{documents.length !== 1 ? "s" : ""} encontrado
                  {documents.length !== 1 ? "s" : ""}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Tamaño</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          <span>{documento.name}</span>
                        </div>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
