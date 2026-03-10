"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { ImageUpload } from "@/components/ui/image-upload"

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

export function EditNewsForm({ news: initialNews, redirectPath }: EditNewsFormProps) {
  const router = useRouter()
  const [news, setNews] = useState(() => {
    // Format the date for the input field (YYYY-MM-DD)
    const dateObj = new Date(initialNews.date)
    const formattedDate = dateObj.toISOString().split('T')[0]
    
    return {
      ...initialNews,
      date: formattedDate
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    isUploading: boolean
  }>({ current: 0, total: 0, isUploading: false })
  const [category, setCategory] = useState<string>(() => {
    // Set category from the first tag if it exists and matches our predefined categories
    const predefinedCategories = ["torneos", "resultados", "institucional", "clases", "eventos", "partidas", "entrevistas"]
    const firstTag = initialNews.tags?.[0]
    return firstTag && predefinedCategories.includes(firstTag) ? firstTag : ""
  })
  const [contentBlocks, setContentBlocks] = useState<any[]>(() => {
    // Try to parse the text content as JSON to get the structured blocks
    try {
      let parsedContent
      try {
        parsedContent = JSON.parse(initialNews.text)
      } catch (e) {
        parsedContent = null
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
            }
          }
          // Handle chess_game blocks that might have incomplete structure
          if (block.type === 'chess_game') {
            return {
              ...block,
              content: {
                pgn: block.content?.pgn || '',
                whitePlayer: block.content?.whitePlayer || { type: 'custom', value: 'Blanco' },
                blackPlayer: block.content?.blackPlayer || { type: 'custom', value: 'Negro' },
                result: block.content?.result || '1-0'
              }
            }
          }
          // Handle image blocks - convert URLs to proper structure for display
          if (block.type === 'image') {
            const imageUrl = block.url || block.content?.src || block.content?.url || null
            return {
              type: 'image',
              content: {
                url: imageUrl,
                caption: block.caption || block.content?.caption || '',
                filePath: block.content?.src || null // Store the file path for deletion
              }
            }
          }
          return block
        })
        
        return normalizedBlocks
      } else {
        // If it's not an array, create a single text block
        return [{ type: 'text', content: String(initialNews.text) }]
      }
    } catch (e) {
      // If parsing fails, treat it as a single text block
      return [{ type: 'text', content: String(initialNews.text) }]
    }
  })

  // Function to get public URL from file path
  const getPublicUrl = (filePath: string) => {
    if (!filePath) return null
    const supabase = createClient()
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)
    return publicUrl
  }

  // Function to process multiple image uploads in chunks (for bulk operations)
  const processImageUploadsInChunks = async (imageFiles: File[], newsId: number) => {
    const CHUNK_SIZE = 5 // Upload 5 images at a time
    const totalChunks = Math.ceil(imageFiles.length / CHUNK_SIZE)
    let uploadResults: Array<{ filePath: string; publicUrl: string }> = []
    
    if (imageFiles.length === 0) return uploadResults
    
    setUploadProgress({ current: 0, total: imageFiles.length, isUploading: true })
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      for (let i = 0; i < imageFiles.length; i += CHUNK_SIZE) {
        const chunk = imageFiles.slice(i, i + CHUNK_SIZE)
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1
        
        try {
          const formData = new FormData()
          chunk.forEach((file, chunkIndex) => {
            formData.append(`file-${chunkIndex}`, file)
            formData.append(`prefix-${chunkIndex}`, `block-${i + chunkIndex}`)
          })

          const uploadResponse = await fetch(`/api/news/${newsId}/upload-images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error(`Error uploading chunk ${chunkNumber}/${totalChunks}: ${uploadResponse.statusText}`)
          }

          const chunkResults = await uploadResponse.json()
          
          // Convert results to expected format
          const processedResults = chunkResults.map((result: any) => ({
            filePath: result.filePath,
            publicUrl: getPublicUrl(result.filePath) || ''
          }))
          
          uploadResults.push(...processedResults)
          
          // Update progress
          setUploadProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, imageFiles.length) }))
          
          // Add delay between chunks
          if (i + CHUNK_SIZE < imageFiles.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
        } catch (error) {
          console.error(`Failed to upload chunk ${chunkNumber}/${totalChunks}:`, error)
          throw new Error(`Failed to upload images (chunk ${chunkNumber}/${totalChunks}). Try reducing the number of images or upload in smaller batches.`)
        }
      }
      
      return uploadResults
    } finally {
      setUploadProgress(prev => ({ ...prev, isUploading: false }))
    }
  }

  // Function to add multiple image blocks at once (for bulk operations)
  const addMultipleImageBlocks = async (files: File[]) => {
    if (files.length === 0) return
    
    // Warn users about large uploads
    if (files.length > 20) {
      const proceed = confirm(
        `Estás intentando subir ${files.length} imágenes. Esto puede tomar varios minutos y podría fallar con conexiones lentas. ¿Deseas continuar?`
      )
      if (!proceed) return
    }
    
    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} archivo(s) exceden el límite de 5MB y serán omitidos.`)
      files = files.filter(file => file.size <= 5 * 1024 * 1024)
    }
    
    if (files.length === 0) {
      setError('No hay archivos válidos para subir.')
      return
    }
    
    try {
      setError(null) // Clear any previous errors
      
      // Process uploads in chunks
      const uploadResults = await processImageUploadsInChunks(files, news.id)
      
      // Create new image blocks with the uploaded images
      const newImageBlocks = uploadResults.map((result, index) => ({
        type: 'image',
        content: {
          url: result.publicUrl,
          caption: '',
          filePath: result.filePath
        }
      }))
      
      // Add all new blocks to the content
      setContentBlocks(prev => [...prev, ...newImageBlocks])
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir las imágenes'
      setError(errorMessage)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news) return

    try {
      setIsSaving(true)
      setError(null)

      // Format the date to ISO string for API
      const formattedDate = new Date(news.date + 'T00:00:00Z').toISOString()
      
      // Convert content blocks to JSON string
      const contentJson = JSON.stringify(contentBlocks)

      const updateData = {
        title: news.title,
        date: formattedDate,
        extract: news.extract,
        text: contentJson, // Save the structured content
        tags: category ? [category] : [],
        club_id: news.club_id, // Keep the original club_id
        image: news.image // Include the featured image path
      }
      
      // Use the API to update news
      await apiCall(`/news/${news.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })

      // Add a small delay to ensure the update is completed before redirecting
      setTimeout(() => {
        router.push(redirectPath)
        router.refresh()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la noticia'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Function to add a new content block
  const addContentBlock = (type: string) => {
    let newBlock
    switch (type) {
      case 'text':
        newBlock = { type: 'text', content: '' }
        break
      case 'image':
        newBlock = { 
          type: 'image', 
          content: {
            url: null,
            caption: '',
            filePath: null
          }
        }
        break
      case 'chess_game':
        newBlock = { 
          type: 'chess_game', 
          content: {
            pgn: '',
            whitePlayer: { type: 'user', value: '' },
            blackPlayer: { type: 'user', value: '' },
            result: '1-0'
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

  // Handler for featured image upload
  const handleFeaturedImageUpload = (filePath: string, publicUrl: string) => {
    setNews({ ...news, image: filePath })
  }

  // Handler for featured image removal
  const handleFeaturedImageRemove = () => {
    setNews({ ...news, image: null })
  }

  // Handler for content block image upload
  const handleBlockImageUpload = (index: number, filePath: string, publicUrl: string) => {
    const updatedBlock = {
      ...contentBlocks[index],
      content: {
        ...contentBlocks[index].content,
        url: publicUrl,
        filePath: filePath
      }
    }
    updateContentBlock(index, updatedBlock)
  }

  // Handler for content block image removal
  const handleBlockImageRemove = (index: number, filePath: string) => {
    const updatedBlock = {
      ...contentBlocks[index],
      content: {
        ...contentBlocks[index].content,
        url: null,
        filePath: null
      }
    }
    updateContentBlock(index, updatedBlock)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" className="md:size-icon" onClick={() => router.push(redirectPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-terracotta">Editar Noticia</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {news.club?.name ? `Modifica los detalles de la noticia para ${news.club.name}.` : 'Modifica los detalles de la noticia.'}
            </p>
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
            <Label htmlFor="category" className="text-sm md:text-sm font-medium">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="text-sm md:text-base">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="torneos" className="!py-1.5">Torneos</SelectItem>
                <SelectItem value="resultados" className="!py-1.5">Resultados</SelectItem>
                <SelectItem value="institucional" className="!py-1.5">Institucional</SelectItem>
                <SelectItem value="clases" className="!py-1.5">Clases</SelectItem>
                <SelectItem value="eventos" className="!py-1.5">Eventos</SelectItem>
                <SelectItem value="partidas" className="!py-1.5">Partidas</SelectItem>
                <SelectItem value="entrevistas" className="!py-1.5">Entrevistas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Featured Image Upload */}
          <ImageUpload
            newsId={news.id.toString()}
            currentImage={news.image ? getPublicUrl(news.image) ?? undefined : undefined}
            currentImagePath={news.image || undefined}
            onImageUpload={handleFeaturedImageUpload}
            onImageRemove={handleFeaturedImageRemove}
            label="Imagen destacada"
            placeholder="Haz clic para subir la imagen destacada"
          />

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
                      <RichTextEditor
                        content={block.content}
                        onChange={(content) => updateContentBlock(index, { ...block, content })}
                        placeholder="Escribe el contenido aquí..."
                      />
                    </div>
                  )}
                  
                  {block.type === 'image' && (
                    <div className="pt-8 md:pt-6 space-y-2">
                      <ImageUpload
                        newsId={news.id.toString()}
                        currentImage={block.content?.url}
                        currentImagePath={block.content?.filePath}
                        onImageUpload={(filePath, publicUrl) => handleBlockImageUpload(index, filePath, publicUrl)}
                        onImageRemove={(filePath) => handleBlockImageRemove(index, filePath)}
                        label="Imagen del bloque"
                        placeholder="Haz clic para subir una imagen"
                      />
                      <Input
                        placeholder="Pie de foto (opcional)"
                        value={block.content?.caption || ''}
                        onChange={(e) => updateContentBlock(index, { 
                          ...block, 
                          content: { ...block.content, caption: e.target.value }
                        })}
                        className="text-sm md:text-base"
                      />
                    </div>
                  )}
                  
                  {block.type === 'chess_game' && block.content && (
                    <div className="pt-8 md:pt-6 space-y-2">
                      <Textarea
                        placeholder="PGN (notación)"
                        value={block.content.pgn || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, pgn: e.target.value } })}
                        className="min-h-[100px] md:min-h-[120px] text-sm md:text-base"
                      />
                      <Input
                        placeholder="Jugador blanco"
                        value={block.content.whitePlayer?.value || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, whitePlayer: { ...block.content.whitePlayer, value: e.target.value } } })}
                        className="text-sm md:text-base"
                      />
                      <Input
                        placeholder="Jugador negro"
                        value={block.content.blackPlayer?.value || ''}
                        onChange={(e) => updateContentBlock(index, { ...block, content: { ...block.content, blackPlayer: { ...block.content.blackPlayer, value: e.target.value } } })}
                        className="text-sm md:text-base"
                      />
                      <div className="space-y-2">
                        <Label htmlFor={`result-${index}`} className="text-sm md:text-sm font-medium">Resultado</Label>
                        <Select 
                          value={block.content.result || "1-0"} 
                          onValueChange={(value) => updateContentBlock(index, { ...block, content: { ...block.content, result: value } })}
                        >
                          <SelectTrigger id={`result-${index}`} className="text-sm md:text-base">
                            <SelectValue placeholder="Seleccionar resultado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-0">1-0 (Ganan las blancas)</SelectItem>
                            <SelectItem value="0-1">0-1 (Ganan las negras)</SelectItem>
                            <SelectItem value="1/2-1/2">1/2-1/2 (Tablas)</SelectItem>
                            <SelectItem value="*">* (Partida en curso)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                <Button type="button" variant="outline" onClick={() => addContentBlock('chess_game')} size="sm" className="text-sm w-full sm:w-auto">
                  + Partida de ajedrez
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('bulk-image-upload')?.click()} 
                  size="sm" 
                  className="text-sm w-full sm:w-auto"
                  disabled={uploadProgress.isUploading}
                >
                  + Múltiples Imágenes
                </Button>
                <input
                  id="bulk-image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      addMultipleImageBlocks(files)
                      e.target.value = '' // Reset input
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {news.club && (
            <div className="grid gap-2">
              <Label className="text-sm md:text-sm font-medium">Club Asociado</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{news.club.name}</p>
                <p className="text-xs text-muted-foreground">La noticia estará asociada a este club</p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
} 