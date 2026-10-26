"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ErrorAlert } from "@/components/error-alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { updateNewsAction } from "@/lib/actions/news"
import { getDateInputValue } from "@/lib/dateUtils"
import { processImageUploadsInChunks } from "@/lib/news-content-utils"
import {
  NEWS_CATEGORIES,
  normalizeStoredNewsBlocks,
  type EditableNewsBlock,
  type StoredImageBlockContent,
} from "@/components/news/types"
import { NewsContentBlocksEditorSimple } from "@/components/news/news-content-blocks-editor-simple"
import { NewsFormActions, NewsFormHeader } from "@/components/news/news-form-header"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { useEditableNewsBlocks } from "@/components/news/use-news-content-blocks"

interface News {
  id: number
  title: string
  date: string
  image: string | null
  extract: string
  text: string
  tags: string[]
  club_id: number | null
  club: {
    id: number
    name: string
  } | null
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
}

interface EditNewsFormProps {
  news: News
  redirectPath: string
}

export function EditNewsForm({ news: initialNews, redirectPath }: EditNewsFormProps) {
  const router = useRouter()
  const [news, setNews] = useState(() => ({
    ...initialNews,
    date: getDateInputValue(initialNews.date),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    isUploading: false,
  })
  const [category, setCategory] = useState<string>(() => {
    const predefinedCategories = NEWS_CATEGORIES.map(c => c.value)
    const firstTag = initialNews.tags?.[0]
    return firstTag && predefinedCategories.includes(firstTag as typeof predefinedCategories[number]) ? firstTag : ""
  })
  const [contentBlocks, setContentBlocks] = useState<EditableNewsBlock[]>(() =>
    normalizeStoredNewsBlocks(initialNews.text)
  )
  const blockActions = useEditableNewsBlocks(contentBlocks, setContentBlocks)
  // Large batches are confirmed first (they are slow and may fail).
  const [pendingBulkFiles, setPendingBulkFiles] = useState<File[] | null>(null)

  const getPublicUrl = (filePath: string) => {
    if (!filePath) return null
    const supabase = createClient()
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)
    return publicUrl
  }

  const requestBulkUpload = (files: File[]) => {
    if (files.length > 20) {
      setPendingBulkFiles(files)
      return
    }
    void addMultipleImageBlocks(files)
  }

  const addMultipleImageBlocks = async (files: File[]) => {
    if (files.length === 0) return

    let validFiles = files
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} archivo(s) exceden el límite de 5MB y serán omitidos.`)
      validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
    }

    if (validFiles.length === 0) {
      setError('No hay archivos válidos para subir.')
      return
    }

    try {
      setError(null)
      const uploadResults = await processImageUploadsInChunks(validFiles, news.id, setUploadProgress)

      const newImageBlocks: StoredImageBlockContent[] = uploadResults.map((result) => ({
        type: 'image',
        content: {
          url: result.publicUrl,
          caption: '',
          filePath: result.filePath,
        },
      }))

      setContentBlocks(prev => [...prev, ...newImageBlocks])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir las imágenes'
      setError(errorMessage)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError(null)

      const updateData = {
        title: news.title,
        date: news.date,
        extract: news.extract,
        text: JSON.stringify(contentBlocks),
        tags: category ? [category] : [],
        club_id: news.club_id,
        image: news.image,
      }

      const result = await updateNewsAction(news.id, updateData)
      if (!result.ok) {
        throw new Error(result.error)
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la noticia'
      setError(errorMessage)
      setIsSaving(false)
    }
  }

  const handleFeaturedImageUpload = (filePath: string, _publicUrl: string) => {
    setNews({ ...news, image: filePath })
  }

  const handleFeaturedImageRemove = () => {
    setNews({ ...news, image: null })
  }

  const handleBlockImageUpload = (index: number, filePath: string, publicUrl: string) => {
    const block = contentBlocks[index] as StoredImageBlockContent
    blockActions.updateContentBlock(index, {
      ...block,
      content: {
        ...block.content,
        url: publicUrl,
        filePath,
      },
    })
  }

  const handleBlockImageRemove = (index: number) => {
    const block = contentBlocks[index] as StoredImageBlockContent
    blockActions.updateContentBlock(index, {
      ...block,
      content: {
        ...block.content,
        url: null,
        filePath: null,
      },
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <NewsFormHeader title="Editar noticia" backHref={redirectPath} />

      {error && <ErrorAlert message={error} />}

      {uploadProgress.isUploading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subiendo imágenes...</AlertTitle>
          <AlertDescription>
            {uploadProgress.current} de {uploadProgress.total}. No cierres esta ventana.
            <div className="mt-2 bg-muted rounded-full h-2">
              <div
                className="bg-amber h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={news.title}
              onChange={(e) => setNews({ ...news, title: e.target.value })}
              required
              placeholder="Título de la noticia"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={news.date}
              onChange={(e) => setNews({ ...news, date: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extract">Extracto</Label>
            <Textarea
              id="extract"
              value={news.extract}
              onChange={(e) => setNews({ ...news, extract: e.target.value })}
              placeholder="Breve descripción de la noticia..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {NEWS_CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="!py-1.5">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ImageUpload
            newsId={news.id.toString()}
            currentImage={news.image ? getPublicUrl(news.image) ?? undefined : undefined}
            currentImagePath={news.image || undefined}
            onImageUpload={handleFeaturedImageUpload}
            onImageRemove={handleFeaturedImageRemove}
            label="Imagen destacada"
            placeholder="Haz clic para subir la imagen destacada"
          />

          {news.club && (
            <div className="grid gap-2">
              <Label>Entidad</Label>
              <p className="rounded-md bg-muted p-3 text-sm font-medium">{news.club.name}</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <NewsContentBlocksEditorSimple
              blocks={contentBlocks}
              blockActions={blockActions}
              imageMode="upload"
              newsId={news.id.toString()}
              onBlockImageUpload={handleBlockImageUpload}
              onBlockImageRemove={handleBlockImageRemove}
              onBulkImageUpload={() => document.getElementById('bulk-image-upload')?.click()}
              isUploading={uploadProgress.isUploading}
            />
            <input
              id="bulk-image-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  requestBulkUpload(files)
                  e.target.value = ''
                }
              }}
            />
          </div>

        </div>

        <NewsFormActions
          cancelHref={redirectPath}
          saveLabel="Guardar"
          savingLabel="Guardando..."
          isSaving={isSaving}
        />
      </form>

      <AdminConfirmDialog
        open={pendingBulkFiles !== null}
        onOpenChange={(open) => !open && setPendingBulkFiles(null)}
        title={`¿Subir ${pendingBulkFiles?.length ?? 0} imágenes?`}
        description="Puede tardar varios minutos y fallar con conexiones lentas."
        confirmLabel="Subir"
        destructive={false}
        onConfirm={() => {
          const files = pendingBulkFiles ?? []
          setPendingBulkFiles(null)
          void addMultipleImageBlocks(files)
        }}
      />
    </div>
  )
}
