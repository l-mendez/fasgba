"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ErrorAlert } from "@/components/error-alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteNewsAction, updateNewsAction } from "@/lib/actions/news"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import { processNewsContent } from "@/lib/news-content-utils"
import { NEWS_CATEGORIES, createEmptyTextBlock, type NewsBlockContent } from "@/components/news/types"
import { NewsContentBlocksEditor } from "@/components/news/news-content-blocks-editor"
import { useNewsContentBlocks } from "@/components/news/use-news-content-blocks"
import { NewsFormActions, NewsFormHeader } from "@/components/news/news-form-header"

export interface NewsClubOption {
  id: number
  name: string
}

interface NewNewsFormProps {
  userClubs: NewsClubOption[]
  isAdmin: boolean
  defaultEntityId: number | null
  /** List the user's clubs before FASGBA (when coming from club-admin). */
  clubsFirst: boolean
  returnPath: string
}

const FASGBA_VALUE = 'fasgba'

export function NewNewsForm({ userClubs, isAdmin, defaultEntityId, clubsFirst, returnPath }: NewNewsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    date: getArgentinaDateInputValue(),
    extract: "",
    club_id: defaultEntityId,
    image: null as File | null,
    imagePreview: null as string | null,
    category: "",
  })
  const [contentBlocks, setContentBlocks] = useState<NewsBlockContent[]>([createEmptyTextBlock()])
  const blockActions = useNewsContentBlocks(contentBlocks, setContentBlocks)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    isUploading: false,
  })
  const isSubmittingRef = useRef(false)
  // Images need the news id, so the row is created first. If a later step
  // fails we try to delete it; if that fails too, a retry reuses this id
  // instead of creating a duplicate.
  const createdNewsIdRef = useRef<number | null>(null)

  const createNews = async (baseData: Record<string, unknown>): Promise<number> => {
    const supabase = createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      throw new Error('No estás autenticado. Inicia sesión nuevamente.')
    }

    const apiEndpoint = !isAdmin && formData.club_id ? `/api/clubs/${formData.club_id}/news` : '/api/news'
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...baseData, text: JSON.stringify([]) }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const createdNews = await response.json()
    return createdNews.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      setIsSaving(true)
      setError(null)

      const baseData = {
        title: formData.title,
        date: formData.date,
        extract: formData.extract,
        tags: formData.category ? [formData.category] : [],
        club_id: formData.club_id,
      }

      if (createdNewsIdRef.current === null) {
        createdNewsIdRef.current = await createNews(baseData)
      }
      const newsId = createdNewsIdRef.current

      try {
        const { processedContent, featuredImagePath } = await processNewsContent(
          contentBlocks,
          formData.image,
          newsId,
          setUploadProgress
        )

        const updateResult = await updateNewsAction(newsId, {
          ...baseData,
          text: JSON.stringify(processedContent),
          image: featuredImagePath,
        })

        if (!updateResult.ok) {
          throw new Error(updateResult.error)
        }
      } catch (err) {
        const rollback = await deleteNewsAction(newsId).catch(() => null)
        if (rollback?.ok) createdNewsIdRef.current = null
        throw err
      }

      router.push(returnPath)
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la noticia'
      setError(errorMessage)
      setIsSaving(false)
    } finally {
      isSubmittingRef.current = false
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: imageUrl,
      }))
    }
  }

  const fasgbaOption = isAdmin ? <SelectItem value={FASGBA_VALUE}>FASGBA (Federación)</SelectItem> : null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <NewsFormHeader title="Nueva noticia" backHref={returnPath} />

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

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Título de la noticia"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extract">Extracto</Label>
            <Textarea
              id="extract"
              value={formData.extract}
              onChange={(e) => setFormData(prev => ({ ...prev, extract: e.target.value }))}
              placeholder="Breve descripción de la noticia..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {NEWS_CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Imagen destacada</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formData.imagePreview && (
              <img
                src={formData.imagePreview}
                alt="Vista previa"
                className="mt-2 max-h-[150px] rounded-md object-cover"
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entity">Entidad</Label>
            <Select
              value={formData.club_id?.toString() ?? FASGBA_VALUE}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                club_id: value === FASGBA_VALUE ? null : parseInt(value),
              }))}
            >
              <SelectTrigger id="entity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!clubsFirst && fasgbaOption}
                {userClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
                {clubsFirst && fasgbaOption}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <NewsContentBlocksEditor blocks={contentBlocks} blockActions={blockActions} />
          </div>
        </div>

        <NewsFormActions
          cancelHref={returnPath}
          saveLabel="Crear"
          savingLabel="Creando..."
          isSaving={isSaving}
        />
      </form>
    </div>
  )
}
