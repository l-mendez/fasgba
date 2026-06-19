"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ErrorAlert } from "@/components/error-alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import {
  NEWS_CATEGORIES,
  createEmptyTextBlock,
  type EditableNewsBlock,
} from "@/components/news/types"
import { NewsContentBlocksEditorSimple } from "@/components/news/news-content-blocks-editor-simple"
import { useEditableNewsBlocks } from "@/components/news/use-news-content-blocks"
import { NewsFormHeader } from "@/components/news/news-form-header"
import { apiCall } from "@/lib/utils/apiClient"

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

interface NewNewsFormProps {
  selectedClub: Club
  clubs: Club[]
}

export function NewNewsForm({ selectedClub, clubs }: NewNewsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    date: getArgentinaDateInputValue(),
    extract: "",
    club_id: selectedClub.id,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<string>("")
  const [contentBlocks, setContentBlocks] = useState<EditableNewsBlock[]>([createEmptyTextBlock()])
  const blockActions = useEditableNewsBlocks(contentBlocks, setContentBlocks)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError(null)

      const newsData = {
        title: formData.title,
        date: formData.date,
        extract: formData.extract,
        text: JSON.stringify(contentBlocks),
        tags: category ? [category] : [],
        club_id: formData.club_id,
      }

      await apiCall(`/api/clubs/${formData.club_id}/news`, {
        method: 'POST',
        body: JSON.stringify(newsData),
      })

      setTimeout(() => {
        router.push('/club-admin/noticias')
        router.refresh()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la noticia'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <NewsFormHeader
        title="Nueva Noticia"
        saveLabel="Crear Noticia"
        savingLabel="Creando..."
        isSaving={isSaving}
        onBack={() => router.push('/club-admin/noticias')}
        onSubmit={handleSubmit}
      />

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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extract">Extracto</Label>
            <Textarea
              id="extract"
              value={formData.extract}
              onChange={(e) => setFormData({ ...formData, extract: e.target.value })}
              placeholder="Breve descripción de la noticia..."
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

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <NewsContentBlocksEditorSimple
              blocks={contentBlocks}
              blockActions={blockActions}
              imageMode="url"
              layout="stack"
            />
          </div>

          {clubs.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="club">Club</Label>
              <Select
                value={formData.club_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, club_id: parseInt(value) })}
              >
                <SelectTrigger id="club">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {clubs.length === 1 && (
            <div className="grid gap-2">
              <Label>Club Asociado</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{selectedClub.name}</p>
                <p className="text-xs text-muted-foreground">La noticia estará asociada a este club</p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
