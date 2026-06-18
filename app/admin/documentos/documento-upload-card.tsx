"use client"

import { useState } from "react"
import { FileText, RefreshCw, Upload } from "lucide-react"

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
import { uploadDocumentoAction } from "@/lib/actions/documentos"
import {
  DOCUMENT_CATEGORIES,
  extractDocumentName,
  formatFileSize,
  isValidDocument,
  type DocumentCategory,
} from "@/lib/documentosUtils"

interface DocumentoUploadCardProps {
  onUploaded: (documentId: number) => Promise<void> | void
  setErrorMessage: (message: string) => void
  setSuccessMessage: (message: string) => void
}

export function DocumentoUploadCard({
  onUploaded,
  setErrorMessage,
  setSuccessMessage,
}: DocumentoUploadCardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("otros")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
    const validation = isValidDocument(selectedFile)

    if (!validation.valid) {
      setErrorMessage(validation.error || "Archivo no válido")
      return
    }

    setFile(selectedFile)
    setDocumentName(extractDocumentName(selectedFile))
    setErrorMessage("")
    setSuccessMessage("")
  }

  const handleClearFile = () => {
    setFile(null)
    setDocumentName("")
    setErrorMessage("")
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
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", documentName.trim())
      formData.append("category", category)

      const result = await uploadDocumentoAction(formData)

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      // Reset form
      setFile(null)
      setDocumentName("")
      setCategory("otros")

      // Show success message
      setSuccessMessage(result.data.message)

      // Reload documents list and keep the uploaded document visible even if
      // it lands beyond the first page in the current sort.
      await onUploaded(result.data.documento.id)
    } catch (error) {
      console.error("Upload error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido al subir el documento"
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir documento</CardTitle>
        <CardDescription>
          Selecciona un archivo PDF o Excel para subir a la biblioteca de documentos
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
              Archivos PDF y Excel (máximo 10MB)
            </p>
            {file && (
              <p className="text-sm text-muted-foreground">
                Tamaño: {formatFileSize(file.size)}
              </p>
            )}
          </div>
          <input
            type="file"
            accept=".pdf,application/pdf,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
  )
}
