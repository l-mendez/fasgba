"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, supabaseAdmin } from "@/lib/supabaseClient"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
  created_by_user_id: number | null
  created_by_user: {
    id: number
    name: string
    surname: string
    email: string
    profile_picture: string | null
  } | null
  created_at: string
  updated_at: string
}

type SupabaseNews = {
  id: any
  title: any
  date: any
  image: any
  extract: any
  text: any
  tags: any
  club_id: any
  club: {
    id: any
    name: any
  } | null
  created_by_user_id: any
  created_by_user: {
    id: any
    name: any
    surname: any
    email: any
    profile_picture: any
  } | null
  created_at: any
  updated_at: any
}

export default function EditNewsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [news, setNews] = useState<News | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [contentBlocks, setContentBlocks] = useState<any[]>([])
  
  // Unwrap params using React.use() to fix the warning
  const unwrappedParams = React.use(params as any) as { id: string }
  const newsId = unwrappedParams.id

  // For debugging
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    async function fetchNews() {
      try {
        setDebugInfo("Fetching news with ID: " + newsId);
        const { data, error } = await supabase
          .from('news')
          .select(`
            id,
            title,
            date,
            image,
            extract,
            text,
            tags,
            club_id,
            club:clubs(id, name),
            created_by_user_id,
            created_by_user:users(id, name, surname, email, profile_picture),
            created_at,
            updated_at
          `)
          .eq('id', newsId)
          .single()

        if (error) {
          setDebugInfo(prev => prev + "\nError fetching news: " + error.message);
          throw error;
        }

        setDebugInfo(prev => prev + "\nNews fetched successfully!");
        const typedData = (data as unknown as SupabaseNews)
        
        // Try to parse the text content as JSON to get the structured blocks
        try {
          let parsedContent;
          try {
            parsedContent = JSON.parse(typedData.text);
          } catch (e) {
            setDebugInfo(prev => prev + "\nFailed to parse text as JSON, treating as plain text");
            parsedContent = null;
          }
          
          if (Array.isArray(parsedContent)) {
            setContentBlocks(parsedContent);
            setDebugInfo(prev => prev + "\nParsed content blocks: " + parsedContent.length);
          } else {
            // If it's not an array, create a single text block
            setContentBlocks([{ type: 'text', content: String(typedData.text) }]);
            setDebugInfo(prev => prev + "\nCreated single text block");
          }
        } catch (e) {
          // If parsing fails, treat it as a single text block
          setContentBlocks([{ type: 'text', content: String(typedData.text) }]);
          setDebugInfo(prev => prev + "\nFallback: created single text block from raw text");
        }
        
        // Format the date for the input field (YYYY-MM-DD)
        const dateObj = new Date(typedData.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        
        setNews({
          id: Number(typedData.id),
          title: String(typedData.title),
          date: formattedDate, // Use formatted date for the input
          image: typedData.image as string | null,
          extract: String(typedData.extract),
          text: String(typedData.text),
          tags: Array.isArray(typedData.tags) ? typedData.tags.map(String) : [],
          club_id: typedData.club_id ? Number(typedData.club_id) : null,
          club: typedData.club ? {
            id: Number(typedData.club.id),
            name: String(typedData.club.name)
          } : null,
          created_by_user_id: typedData.created_by_user_id ? Number(typedData.created_by_user_id) : null,
          created_by_user: typedData.created_by_user ? {
            id: Number(typedData.created_by_user.id),
            name: String(typedData.created_by_user.name),
            surname: String(typedData.created_by_user.surname),
            email: String(typedData.created_by_user.email),
            profile_picture: typedData.created_by_user.profile_picture as string | null
          } : null,
          created_at: String(typedData.created_at),
          updated_at: String(typedData.updated_at)
        })
        setTags(typedData.tags || [])
      } catch (err) {
        setDebugInfo(prev => prev + "\nError in fetchNews: " + (err instanceof Error ? err.message : String(err)));
        setError(err instanceof Error ? err.message : "Error al cargar la noticia")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [newsId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news) return

    try {
      setIsSaving(true)
      setError(null)
      setDebugInfo("Starting save operation for news ID: " + news.id);

      // Format the date to ISO string for Supabase
      const formattedDate = new Date(news.date + 'T00:00:00Z').toISOString();
      setDebugInfo(prev => prev + "\nFormatted date: " + formattedDate);
      
      // Convert content blocks to JSON string
      const contentJson = JSON.stringify(contentBlocks);
      setDebugInfo(prev => prev + "\nContent blocks stringified, length: " + contentJson.length);

      const updateData = {
        title: news.title,
        date: formattedDate,
        extract: news.extract,
        text: contentJson, // Save the structured content
        tags: tags,
        updated_at: new Date().toISOString()
      };
      
      setDebugInfo(prev => prev + "\nUpdate data prepared");
      
      // Use supabaseAdmin to bypass Row Level Security
      const { data, error } = await supabaseAdmin
        .from('news')
        .update(updateData)
        .eq('id', news.id)
        .select();

      if (error) {
        setDebugInfo(prev => prev + "\nSupabase error: " + error.message);
        throw new Error(error.message || 'Error al guardar la noticia');
      }

      setDebugInfo(prev => prev + "\nUpdate successful! Data returned: " + (data ? data.length : 0) + " rows");
      
      // Add a small delay to ensure the update is completed before redirecting
      setTimeout(() => {
        router.push('/admin/noticias');
        router.refresh();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la noticia';
      setError(errorMessage);
      setDebugInfo(prev => prev + "\nError saving noticia: " + errorMessage);
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
      case 'chess':
        newBlock = { type: 'chess', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', pgn: '' };
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
          <Button onClick={() => router.push('/admin/noticias')} className="mt-4">
            Volver
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
          <Button onClick={() => router.push('/admin/noticias')} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/noticias')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Editar Noticia</h1>
            <p className="text-muted-foreground">Modifica los detalles de la noticia.</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Debug info panel - only visible during development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="bg-slate-100 p-4 rounded text-xs font-mono overflow-auto max-h-60">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre>{debugInfo}</pre>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
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
                  
                  {block.type === 'chess' && (
                    <div className="pt-6 space-y-2">
                      <Input
                        placeholder="FEN (posición)"
                        value={block.fen}
                        onChange={(e) => updateContentBlock(index, { ...block, fen: e.target.value })}
                      />
                      <Textarea
                        placeholder="PGN (notación)"
                        value={block.pgn}
                        onChange={(e) => updateContentBlock(index, { ...block, pgn: e.target.value })}
                      />
                      <div className="mt-2 p-2 border rounded-md bg-gray-50">
                        <p className="text-sm text-muted-foreground">Vista previa del tablero no disponible en el editor</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => addContentBlock('text')}>+ Texto</Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('image')}>+ Imagen</Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('chess')}>+ Partida de ajedrez</Button>
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
        </div>
      </form>
    </div>
  )
} 