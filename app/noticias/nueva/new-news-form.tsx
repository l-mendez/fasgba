"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ErrorAlert } from "@/components/error-alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateNewsAction } from "@/lib/actions/news"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import { processNewsContent } from "@/lib/news-content-utils"
import { NEWS_CATEGORIES, createEmptyTextBlock, type NewsBlockContent } from "@/components/news/types"
import { NewsContentBlocksEditor } from "@/components/news/news-content-blocks-editor"
import { useNewsContentBlocks } from "@/components/news/use-news-content-blocks"

interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  role?: string
}

interface NewNewsFormProps {
  user: User
  userClubs: Club[]
  isAdmin: boolean
  defaultEntityId: number | null
  defaultEntityType: 'fasgba' | 'club'
}

export function NewNewsForm({ userClubs, isAdmin, defaultEntityId }: NewNewsFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      setIsSaving(true)
      setError(null)

      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      }

      const initialNewsData = {
        title: formData.title,
        date: formData.date,
        extract: formData.extract,
        text: JSON.stringify([]),
        tags: formData.category ? [formData.category] : [],
        club_id: formData.club_id,
      }

      let apiEndpoint = '/api/news'
      if (!isAdmin && formData.club_id) {
        apiEndpoint = `/api/clubs/${formData.club_id}/news`
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(initialNewsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const createdNews = await response.json()
      const newsId = createdNews.id

      const { processedContent, featuredImagePath } = await processNewsContent(
        contentBlocks,
        formData.image,
        newsId,
        setUploadProgress
      )

      const updateResult = await updateNewsAction(newsId, {
        text: JSON.stringify(processedContent),
        image: featuredImagePath,
      })

      if (!updateResult.ok) {
        throw new Error(updateResult.error)
      }

      const redirectPath = isAdmin ? '/admin/noticias' : '/club-admin/noticias'

      setTimeout(() => {
        router.push(redirectPath)
        router.refresh()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la noticia'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
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

  const backPath = isAdmin ? '/admin/noticias' : '/club-admin/noticias'

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(backPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nueva Noticia</h1>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Creando...' : 'Crear Noticia'}
        </Button>
      </div>

      {uploadProgress.isUploading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subiendo imágenes...</AlertTitle>
          <AlertDescription>
            Procesando {uploadProgress.current} de {uploadProgress.total} imágenes.
            Por favor, no cierre esta ventana.
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <ErrorAlert title="Error" message={error} />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
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
            <Label htmlFor="extract">Extracto</Label>
            <Textarea
              id="extract"
              value={formData.extract}
              onChange={(e) => setFormData(prev => ({ ...prev, extract: e.target.value }))}
              placeholder="Breve descripción de la noticia..."
            />
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
              <div className="mt-2">
                <img
                  src={formData.imagePreview}
                  alt="Vista previa"
                  className="max-h-[150px] rounded-md object-cover"
                />
              </div>
            )}
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
            <Label htmlFor="entity">Entidad</Label>
            <Select
              value={formData.club_id?.toString() ?? 'fasgba'}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                club_id: value === 'fasgba' ? null : parseInt(value),
              }))}
            >
              <SelectTrigger id="entity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && (
                  <SelectItem value="fasgba">FASGBA (Federación)</SelectItem>
                )}
                {userClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {formData.club_id ?
                `La noticia estará asociada a ${userClubs.find((c) => c.id === formData.club_id)?.name}` :
                'La noticia estará asociada a la Federación FASGBA'
              }
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <NewsContentBlocksEditor blocks={contentBlocks} blockActions={blockActions} />
          </div>
        </div>
      </form>
    </div>
  )
}
