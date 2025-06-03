"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createAdminClient } from "@/lib/supabase/admin"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  created_by_auth_id: any
  created_at: any
  updated_at: any
}

export default function EditNewsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [news, setNews] = useState<News | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoria, setCategoria] = useState("")
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
        const supabase = createClient()
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
            club:clubs(id, name)
          `)
          .eq('id', newsId)
          .single();

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
          created_by_auth_id: typedData.created_by_auth_id ? String(typedData.created_by_auth_id) : null,
          created_at: String(typedData.created_at),
          updated_at: String(typedData.updated_at)
        })
        
        // Set category from tags (assume first tag is the category)
        const firstTag = typedData.tags && typedData.tags.length > 0 ? typedData.tags[0] : ""
        setCategoria(String(firstTag))
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
        tags: categoria ? [categoria] : [],
        updated_at: new Date().toISOString()
      };
      
      setDebugInfo(prev => prev + "\nUpdate data prepared");
      
      // Use createAdminClient to bypass Row Level Security, fallback to regular client
      const adminClient = createAdminClient()
      const regularClient = createClient()
      const client = adminClient || regularClient;
      
      const { data, error } = await client
        .from('news')
        .update(updateData)
        .eq('id', newsId)
        .select()
        .single();

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

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'categoria') {
      setCategoria(value)
    }
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
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" className="md:size-icon" onClick={() => router.push('/admin/noticias')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-terracotta">Editar Noticia</h1>
            <p className="text-sm md:text-base text-muted-foreground">Modifica los detalles de la noticia.</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving} className="text-sm md:text-base" size="sm">
          <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          <span className="sm:hidden">{isSaving ? 'Guardando...' : 'Guardar'}</span>
        </Button>
      </div>

      

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
        <div className="grid gap-3 md:gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm md:text-sm font-medium">Título</Label>
            <Input
              id="title"
              value={news.title}
              onChange={(e) => setNews({ ...news, title: e.target.value })}
              required
              className="text-sm md:text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date" className="text-sm md:text-sm font-medium">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={news.date}
              onChange={(e) => setNews({ ...news, date: e.target.value })}
              required
              className="text-sm md:text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extract" className="text-sm md:text-sm font-medium">Extracto</Label>
            <Textarea
              id="extract"
              value={news.extract}
              onChange={(e) => setNews({ ...news, extract: e.target.value })}
              placeholder="Breve descripción de la noticia..."
              className="text-sm md:text-base min-h-[80px] md:min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm md:text-sm font-medium">Contenido</Label>
            <div className="border rounded-md p-3 md:p-4 space-y-3 md:space-y-4">
              {contentBlocks.map((block, index) => (
                <div key={index} className="border rounded-md p-3 md:p-4 relative">
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveBlock(index, 'up')} 
                      disabled={index === 0} 
                      type="button"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
                    >
                      ↑
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => moveBlock(index, 'down')} 
                      disabled={index === contentBlocks.length - 1} 
                      type="button"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
                    >
                      ↓
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive h-7 w-7 md:h-8 md:w-8 p-0 text-xs" 
                      onClick={() => removeContentBlock(index)} 
                      type="button"
                    >
                      ×
                    </Button>
                  </div>
                  
                  {block.type === 'text' && (
                    <div className="pt-8 md:pt-6">
                      <Textarea
                        value={block.content}
                        onChange={(e) => updateContentBlock(index, { ...block, content: e.target.value })}
                        className="min-h-[120px] md:min-h-[150px] text-sm md:text-base"
                        placeholder="Escribe el contenido aquí..."
                      />
                    </div>
                  )}
                  
                  {block.type === 'image' && (
                    <div className="pt-8 md:pt-6 space-y-2">
                      <Input
                        placeholder="URL de la imagen"
                        value={block.url}
                        onChange={(e) => updateContentBlock(index, { ...block, url: e.target.value })}
                        className="text-sm md:text-base"
                      />
                      <Input
                        placeholder="Pie de foto (opcional)"
                        value={block.caption}
                        onChange={(e) => updateContentBlock(index, { ...block, caption: e.target.value })}
                        className="text-sm md:text-base"
                      />
                      {block.url && (
                        <div className="mt-2">
                          <img src={block.url} alt={block.caption} className="max-h-32 md:max-h-48 object-contain w-full" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {block.type === 'chess' && (
                    <div className="pt-8 md:pt-6 space-y-2">
                      <Input
                        placeholder="FEN (posición)"
                        value={block.fen}
                        onChange={(e) => updateContentBlock(index, { ...block, fen: e.target.value })}
                        className="text-sm md:text-base"
                      />
                      <Textarea
                        placeholder="PGN (notación)"
                        value={block.pgn}
                        onChange={(e) => updateContentBlock(index, { ...block, pgn: e.target.value })}
                        className="text-sm md:text-base min-h-[100px] md:min-h-[120px]"
                      />
                      <div className="mt-2 p-2 border rounded-md bg-muted">
                        <p className="text-xs md:text-sm text-muted-foreground">Vista previa del tablero no disponible en el editor</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => addContentBlock('text')} size="sm" className="text-sm w-full sm:w-auto">
                  + Texto
                </Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('image')} size="sm" className="text-sm w-full sm:w-auto">
                  + Imagen
                </Button>
                <Button type="button" variant="outline" onClick={() => addContentBlock('chess')} size="sm" className="text-sm w-full sm:w-auto">
                  + Partida de ajedrez
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm md:text-sm font-medium">Categoría</Label>
            <Select value={categoria} onValueChange={(value) => handleSelectChange("categoria", value)}>
              <SelectTrigger className="text-sm md:text-base">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="torneos">Torneos</SelectItem>
                <SelectItem value="resultados">Resultados</SelectItem>
                <SelectItem value="institucional">Institucional</SelectItem>
                <SelectItem value="clases">Clases</SelectItem>
                <SelectItem value="eventos">Eventos</SelectItem>
                <SelectItem value="partidas">Partidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </div>
  )
} 