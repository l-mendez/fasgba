"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClubContext } from "../../../context/club-context"

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

export default function EditClubNewsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { setSelectedClub } = useClubContext()
  const [news, setNews] = useState<News | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState<string>("")
  const [contentBlocks, setContentBlocks] = useState<any[]>([])
  
  // Unwrap params using React.use() to fix the warning
  const unwrappedParams = React.use(params as any) as { id: string }
  const newsId = unwrappedParams.id

  useEffect(() => {
    async function fetchNews() {
      try {
        // First, fetch the news to get the club_id
        const data = await apiCall(`/news/${newsId}?include=club`)
        
        // Check if the news has a club_id
        if (!data.club_id) {
          // If no club_id, redirect to 404
          notFound()
          return
        }

        // Get current user to check permissions
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error('No hay sesión activa')
        }

        // Check if the current user is an admin of the club that created this news
        const adminCheck = await apiCall(`/clubs/${data.club_id}/admins/${session.user.id}`)
        
        if (!adminCheck.isAdmin) {
          // User is not admin of this club, redirect to 404
          notFound()
          return
        }

        // User is admin, fetch the club details and set it as selected
        const clubData = await apiCall(`/clubs/${data.club_id}`)
        setSelectedClub(clubData)
        
        // Try to parse the text content as JSON to get the structured blocks
        try {
          let parsedContent;
          try {
            parsedContent = JSON.parse(data.text);
          } catch (e) {
            parsedContent = null;
          }
          
          if (Array.isArray(parsedContent)) {
            // Normalize content blocks to handle legacy formats
            const normalizedBlocks = parsedContent.map(block => {
              // Handle legacy chess blocks
              if (block.type === 'chess') {
                return {
                  type: 'chess_game',
                  content: {
                    pgn: block.pgn || '',
                    whitePlayer: { type: 'custom', value: 'Blanco' },
                    blackPlayer: { type: 'custom', value: 'Negro' }
                  }
                };
              }
              // Handle chess_game blocks that might have incomplete structure
              if (block.type === 'chess_game') {
                return {
                  ...block,
                  content: {
                    pgn: block.content?.pgn || '',
                    whitePlayer: block.content?.whitePlayer || { type: 'custom', value: 'Blanco' },
                    blackPlayer: block.content?.blackPlayer || { type: 'custom', value: 'Negro' }
                  }
                };
              }
              return block;
            });
            
            setContentBlocks(normalizedBlocks);
          } else {
            // If it's not an array, create a single text block
            setContentBlocks([{ type: 'text', content: String(data.text) }]);
          }
        } catch (e) {
          // If parsing fails, treat it as a single text block
          setContentBlocks([{ type: 'text', content: String(data.text) }]);
        }
        
        // Format the date for the input field (YYYY-MM-DD)
        const dateObj = new Date(data.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        
        setNews({
          id: Number(data.id),
          title: String(data.title),
          date: formattedDate, // Use formatted date for the input
          image: data.image as string | null,
          extract: String(data.extract || ''),
          text: String(data.text),
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          club_id: data.club_id ? Number(data.club_id) : null,
          club: data.club ? {
            id: Number(data.club.id),
            name: String(data.club.name)
          } : null,
          created_by_auth_id: data.created_by_auth_id,
          created_at: String(data.created_at),
          updated_at: String(data.updated_at)
        })
        
        // Set tags and category
        const newsTagsArray = Array.isArray(data.tags) ? data.tags.map(String) : []
        setTags(newsTagsArray)
        // Set category from the first tag if it exists and matches our predefined categories
        const predefinedCategories = ["torneos", "resultados", "institucional", "clases", "eventos", "partidas"]
        const firstTag = newsTagsArray[0]
        if (firstTag && predefinedCategories.includes(firstTag)) {
          setCategory(firstTag)
        }

      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          notFound()
          return
        }
        setError(err instanceof Error ? err.message : "Error al cargar la noticia")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [newsId, setSelectedClub])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news) return

    try {
      setIsSaving(true)
      setError(null)

      // Format the date to ISO string for API
      const formattedDate = new Date(news.date + 'T00:00:00Z').toISOString();
      
      // Convert content blocks to JSON string
      const contentJson = JSON.stringify(contentBlocks);

      // Prepare tags with category as first tag
      const allTags = category ? [category, ...tags.filter(tag => tag !== category)] : tags

      const updateData = {
        title: news.title,
        date: formattedDate,
        extract: news.extract,
        text: contentJson, // Save the structured content
        tags: allTags,
        club_id: news.club_id // Keep the original club_id
      };
      
      // Use the API to update news
      await apiCall(`/news/${news.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      // Add a small delay to ensure the update is completed before redirecting
      setTimeout(() => {
        router.push('/club-admin/noticias');
        router.refresh();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la noticia';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
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
    let newBlock;
    switch (type) {
      case 'text':
        newBlock = { type: 'text', content: '' };
        break;
      case 'image':
        newBlock = { type: 'image', url: '', caption: '' };
        break;
      case 'chess_game':
        newBlock = { 
          type: 'chess_game', 
          content: {
            pgn: '',
            whitePlayer: { type: 'user', value: '' },
            blackPlayer: { type: 'user', value: '' }
          }
        };
        break;
      default:
        return;
    }
    setContentBlocks([...contentBlocks, newBlock]);
  }

  // Function to update a content block
  const updateContentBlock = (index: number, updatedBlock: any) => {
    const updatedBlocks = [...contentBlocks];
    updatedBlocks[index] = updatedBlock;
    setContentBlocks(updatedBlocks);
  }

  // Function to remove a content block
  const removeContentBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  }

  // Function to move a block up or down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBlocks = [...contentBlocks];
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      setContentBlocks(newBlocks);
    } else if (direction === 'down' && index < contentBlocks.length - 1) {
      const newBlocks = [...contentBlocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setContentBlocks(newBlocks);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando noticia...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/club-admin/noticias')} className="mt-4">
            Volver a Noticias
          </Button>
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">No se encontró la noticia</p>
          <Button onClick={() => router.push('/club-admin/noticias')} className="mt-4">
            Volver a Noticias
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/club-admin/noticias')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Noticia</h1>
            <p className="text-muted-foreground">
              Modifica los detalles de la noticia para {news.club?.name}.
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
              value={news.title}
              onChange={(e) => setNews({ ...news, title: e.target.value })}
              required
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

          <div className="grid gap-2">
            <Label>Club Asociado</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{news.club?.name}</p>
              <p className="text-xs text-muted-foreground">La noticia estará asociada a este club</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
