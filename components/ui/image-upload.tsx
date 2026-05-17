"use client"

import React, { useState, useRef } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadGenericImageAction, deleteGenericImageAction } from "@/lib/actions/uploads"
import { uploadNewsImageAction, deleteNewsImageAction } from "@/lib/actions/news"

interface ImageUploadProps {
  onImageUpload: (filePath: string, publicUrl: string) => void
  onImageRemove?: (filePath: string) => void
  currentImage?: string
  currentImagePath?: string
  newsId?: string
  className?: string
  label?: string
  placeholder?: string
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  currentImage,
  currentImagePath,
  newsId,
  className = "",
  label = "Imagen",
  placeholder = "Haz clic para subir una imagen"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo debe ser menor a 5MB")
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten archivos JPG, PNG, GIF o WebP")
      return
    }

    setError(null)
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = newsId
        ? await uploadNewsImageAction(Number(newsId), fd)
        : await uploadGenericImageAction(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPreview(result.data.publicUrl)
      onImageUpload(result.data.filePath, result.data.publicUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir la imagen'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentImagePath) {
      setPreview(null)
      return
    }

    try {
      const result = newsId
        ? await deleteNewsImageAction(Number(newsId), currentImagePath)
        : await deleteGenericImageAction(currentImagePath)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPreview(null)
      onImageRemove?.(currentImagePath)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la imagen'
      setError(errorMessage)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>

      <div className="space-y-2">
        <div
          className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative"
          onClick={handleClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              <p className="mt-2 text-sm text-muted-foreground">Subiendo imagen...</p>
            </div>
          ) : preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Vista previa"
                className="max-h-64 max-w-full object-contain rounded-md mx-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Haz clic para cambiar
              </div>
            </div>
          ) : (
            <div className="py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm font-medium">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG o GIF (máx. 5MB)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            {error.includes('row-level security') && (
              <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border">
                <p><strong>Sugerencia:</strong> El error indica que faltan políticas de seguridad en Supabase Storage.</p>
                <p>Ejecuta el archivo SQL <code>scripts/setup-storage-policies.sql</code> en tu panel de Supabase.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
