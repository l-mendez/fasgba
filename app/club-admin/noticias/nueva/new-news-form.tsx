"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface NewNewsFormProps {
  selectedClub: Club
  clubs: Club[]
}

// Helper function para hacer llamadas a la API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const url = `/api${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  return response.json()
}

export function NewNewsForm({ selectedClub, clubs }: NewNewsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    extract: "",
    club_id: selectedClub.id
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState<string>("")
  const [contentBlocks, setContentBlocks] = useState<any[]>([
    { type: 'text', content: '' } // Start with one text block
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError(null)

      // Format the date to ISO string for API
      const formattedDate = new Date(formData.date + 'T00:00:00Z').toISOString()
      
      // Convert content blocks to JSON string
      const contentJson = JSON.stringify(contentBlocks)

      // Prepare tags with category as first tag
      const allTags = category ? [category, ...tags.filter(tag => tag !== category)] : tags

      const newsData = {
        title: formData.title,
        date: formattedDate,
        extract: formData.extract,
        text: contentJson, // Save the structured content
        tags: allTags,
        club_id: formData.club_id
      }
      
      // Use the API to create news
      await apiCall(`/clubs/${formData.club_id}/news`, {
        method: 'POST',
        body: JSON.stringify(newsData)
      })

      // Add a small delay to ensure the creation is completed before redirecting
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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Function to add a new content block
  const addContentBlock = (type: string) => {
    let newBlock
    switch (type) {
      case 'text':
        newBlock = { type: 'text', content: '' }
        break
      case 'image':
        newBlock = { type: 'image', url: '', caption: '' }
        break
      case 'chess_game':
        newBlock = { 
          type: 'chess_game', 
          content: {
            pgn: '',
            whitePlayer: { type: 'user', value: '' },
            blackPlayer: { type: 'user', value: '' }
          }
        }
        break
      default:
        return
    }
    setContentBlocks([...contentBlocks, newBlock])
  }

  // Function to update a content block
  const updateContentBlock = (index: number, updatedBlock: any) => {
    const updatedBlocks = [...contentBlocks]
    updatedBlocks[index] = updatedBlock
    setContentBlocks(updatedBlocks)
  }

  // Function to remove a content block
  const removeContentBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index))
  }

  // Function to move a block up or down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBlocks = [...contentBlocks]
      ;[newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]]
      setContentBlocks(newBlocks)
    } else if (direction === 'down' && index < contentBlocks.length - 1) {
      const newBlocks = [...contentBlocks]
      ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
      setContentBlocks(newBlocks)
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/club-admin/noticias')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nueva Noticia</h1>
            <p className="text-muted-foreground">
              Crea una nueva noticia para {selectedClub.name}.
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Creando...' : 'Crear Noticia'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
                <SelectItem value="torneos" className="!py-1.5">Torneos</SelectItem>
                <SelectItem value="resultados" className="!py-1.5">Resultados</SelectItem>
                <SelectItem value="institucional" className="!py-1.5">Institucional</SelectItem>
                <SelectItem value="clases" className="!py-1.5">Clases</SelectItem>
                <SelectItem value="eventos" className="!py-1.5">Eventos</SelectItem>
                <SelectItem value="partidas" className="!py-1.5">Partidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <div className="border rounded-md p-4 space-y-4">
              {contentBlocks.map((block, index) => (
                <div key={index} className="border rounded-md p-4 relative">
                  <div className="absolute right-2 top-2 flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => moveBlock(index, 'up')} disabled={index === 0} type="button">↑</Button>
                    <Button variant="ghost" size="sm" onClick={() => moveBlock(index, 'down')} disabled={index === contentBlocks.length - 1} type="button">↓</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeContentBlock(index)} type="button">×</Button>
                  </div>
                  
                  {block.type === 'text' && (
                    <div className="pt-6">
                      <Textarea
                        value={block.content}
                        onChange={(e) => updateContentBlock(index, { ...block, content: e.target.value })}
                        className="min-h-[150px]"
                        placeholder="Escribe el contenido aquí..."
                      />
                    </div>
                  )}
                  
                  {block.type === 'image' && (
                    <div className="pt-6 space-y-2">
                      <Input
                        placeholder="URL de la imagen"
                        value={block.url}
                        onChange={(e) => updateContentBlock(index, { ...block, url: e.target.value })}
                      />
                      <Input
                        placeholder="Pie de foto (opcional)"
                        value={block.caption}
                        onChange={(e) => updateContentBlock(index, { ...block, caption: e.target.value })}
                      />
                      {block.url && (
                        <div className="mt-2">
                          <img src={block.url} alt={block.caption} className="max-h-48 object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {block.type === 'chess_game' && block.content && (
                    <div className="pt-6 space-y-2">
                      <Textarea
                        placeholder="PGN (notación)"
                        value={block.content.pgn || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, pgn: e.target.value } })}
                        className="min-h-[100px]"
                      />
                      <Input
                        placeholder="Jugador blanco"
                        value={block.content.whitePlayer?.value || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, whitePlayer: { ...block.content.whitePlayer, value: e.target.value } } })}
                      />
                      <Input
                        placeholder="Jugador negro"
                        value={block.content.blackPlayer?.value || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, blackPlayer: { ...block.content.blackPlayer, value: e.target.value } } })}
                      />
                      <div className="mt-2 p-2 border rounded-md bg-muted">
                        <p className="text-sm text-muted-foreground">Vista previa del tablero no disponible en el editor</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => addContentBlock('text')}>+ Texto</Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('image')}>+ Imagen</Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('chess_game')}>+ Partida de ajedrez</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Agregar etiqueta (presiona Enter)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
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