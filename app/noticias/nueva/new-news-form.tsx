"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  MoveUp, 
  MoveDown,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertCircle
} from "lucide-react"
import { DiamondIcon as ChessIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
  allClubs: Club[]
  userClubs: Club[]
  isAdmin: boolean
  defaultEntityId: number | null
  defaultEntityType: 'fasgba' | 'club'
}

// Block types
const BLOCK_TYPES = {
  TEXT: "text",
  CHESS_GAME: "chess_game",
  IMAGE: "image",
} as const

const IMAGE_ALIGNMENTS = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const

type BlockType = typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES]
type ImageAlignment = typeof IMAGE_ALIGNMENTS[keyof typeof IMAGE_ALIGNMENTS]

interface TextBlockContent {
  type: typeof BLOCK_TYPES.TEXT
  content: string
}

interface ImageBlockContent {
  type: typeof BLOCK_TYPES.IMAGE
  content: {
    file: File | null
    imageUrl: string | null
    caption: string
    alignment: ImageAlignment
  }
}

interface ChessGameBlockContent {
  type: typeof BLOCK_TYPES.CHESS_GAME
  content: {
    pgn: string
    whitePlayer: { type: string; value: string }
    blackPlayer: { type: string; value: string }
  }
}

type BlockContent = TextBlockContent | ImageBlockContent | ChessGameBlockContent

// Player selector component
const PlayerSelector = ({ 
  label, 
  type, 
  value, 
  onChange, 
  onTypeChange 
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  onTypeChange: (type: string) => void
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col space-y-3 p-3 border rounded-md">
        <RadioGroup value={type} onValueChange={onTypeChange} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id={`custom-${label}`} />
            <Label htmlFor={`custom-${label}`}>Nombre personalizado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="anonymous" id={`anonymous-${label}`} />
            <Label htmlFor={`anonymous-${label}`}>Anónimo</Label>
          </div>
        </RadioGroup>

        {type === "custom" && (
          <Input placeholder="Nombre del jugador" value={value || ""} onChange={(e) => onChange(e.target.value)} />
        )}

        {type === "anonymous" && <p className="text-sm text-muted-foreground">El jugador aparecerá como "Anónimo"</p>}
      </div>
    </div>
  )
}

// Text block component
const TextBlock = ({ 
  value, 
  onChange, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  index, 
  totalBlocks 
}: {
  value: string
  onChange: (value: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
}) => {
  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor={`text-block-${index}`}>Bloque de texto</Label>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} className="h-8 w-8 p-0">
            <MoveUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            className="h-8 w-8 p-0"
          >
            <MoveDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        id={`text-block-${index}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe el contenido aquí..."
        className="min-h-[150px]"
      />
    </div>
  )
}

// Image block component
const ImageBlock = ({
  value,
  onImageChange,
  onCaptionChange,
  onAlignmentChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalBlocks,
}: {
  value: ImageBlockContent['content']
  onImageChange: (file: File, imageUrl: string) => void
  onCaptionChange: (caption: string) => void
  onAlignmentChange: (alignment: ImageAlignment) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value.imageUrl || null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setPreview(imageUrl)
    onImageChange(file, imageUrl)
  }

  return (
    <div className="border rounded-md p-4 mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            <Label>Imagen</Label>
          </div>
          <div className="flex space-x-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} className="h-8 w-8 p-0">
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={index === totalBlocks - 1}
              className="h-8 w-8 p-0"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleImageClick}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {preview ? (
              <div className="relative mx-auto">
                <div
                  className={`mx-auto ${
                    value.alignment === IMAGE_ALIGNMENTS.LEFT
                      ? "mr-auto ml-0"
                      : value.alignment === IMAGE_ALIGNMENTS.RIGHT
                        ? "ml-auto mr-0"
                        : "mx-auto"
                  }`}
                >
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="max-h-[300px] max-w-full object-contain rounded-md"
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Haz clic para cambiar la imagen</div>
              </div>
            ) : (
              <div className="py-8">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">Haz clic para subir una imagen</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG o GIF (máx. 5MB)</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`caption-${index}`}>Pie de foto</Label>
            <Input
              id={`caption-${index}`}
              value={value.caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Añade un pie de foto o descripción..."
            />
          </div>

          <div className="space-y-2">
            <Label>Alineación</Label>
            <ToggleGroup
              type="single"
              value={value.alignment}
              onValueChange={(val: string) => {
                if (val) onAlignmentChange(val as ImageAlignment)
              }}
              className="justify-start"
            >
              <ToggleGroupItem value={IMAGE_ALIGNMENTS.LEFT} aria-label="Alinear a la izquierda">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value={IMAGE_ALIGNMENTS.CENTER} aria-label="Centrar">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value={IMAGE_ALIGNMENTS.RIGHT} aria-label="Alinear a la derecha">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Chess game block component
const ChessGameBlock = ({
  value,
  onPgnChange,
  onWhitePlayerChange,
  onBlackPlayerChange,
  onWhitePlayerTypeChange,
  onBlackPlayerTypeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalBlocks,
}: {
  value: ChessGameBlockContent['content']
  onPgnChange: (pgn: string) => void
  onWhitePlayerChange: (value: string) => void
  onBlackPlayerChange: (value: string) => void
  onWhitePlayerTypeChange: (type: string) => void
  onBlackPlayerTypeChange: (type: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
}) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border rounded-md p-4 mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <ChessIcon className="h-5 w-5 mr-2" />
            <Label>Partida de ajedrez</Label>
          </div>
          <div className="flex space-x-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} className="h-8 w-8 p-0">
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={index === totalBlocks - 1}
              className="h-8 w-8 p-0"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`pgn-${index}`}>Notación PGN de la partida</Label>
            <Textarea
              id={`pgn-${index}`}
              value={value.pgn}
              onChange={(e) => onPgnChange(e.target.value)}
              placeholder="Pegue aquí la notación PGN de la partida..."
              className="font-mono text-sm"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlayerSelector
              label="Jugador con blancas"
              type={value.whitePlayer.type}
              value={value.whitePlayer.value}
              onChange={(newValue) => onWhitePlayerChange(newValue)}
              onTypeChange={(newType) => onWhitePlayerTypeChange(newType)}
            />

            <PlayerSelector
              label="Jugador con negras"
              type={value.blackPlayer.type}
              value={value.blackPlayer.value}
              onChange={(newValue) => onBlackPlayerChange(newValue)}
              onTypeChange={(newType) => onBlackPlayerTypeChange(newType)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Add block button component
const AddBlockButton = ({ 
  onAddTextBlock, 
  onAddChessGameBlock, 
  onAddImageBlock 
}: {
  onAddTextBlock: () => void
  onAddChessGameBlock: () => void
  onAddImageBlock: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex justify-center my-4">
      <div className="relative">
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex items-center"
          type="button"
        >
          <Plus className="mr-1 h-4 w-4" />
          Añadir bloque
          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-gray-100"
              onClick={() => {
                onAddTextBlock()
                setIsOpen(false)
              }}
              type="button"
            >
              <span>Texto</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-gray-100"
              onClick={() => {
                onAddImageBlock()
                setIsOpen(false)
              }}
              type="button"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Imagen</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-gray-100"
              onClick={() => {
                onAddChessGameBlock()
                setIsOpen(false)
              }}
              type="button"
            >
              <ChessIcon className="mr-2 h-4 w-4" />
              <span>Partida de ajedrez</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function NewNewsForm({ user, allClubs, userClubs, isAdmin, defaultEntityId, defaultEntityType }: NewNewsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    extract: "",
    club_id: defaultEntityId,
    image: null as File | null,
    imagePreview: null as string | null,
    category: "",
    tags: [] as string[],
    contentBlocks: [
      { type: BLOCK_TYPES.TEXT, content: "" } as TextBlockContent,
    ] as BlockContent[]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError(null)

      // Get session for authentication
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      }

      // Process content blocks (upload images if needed)
      const processedContent = await processNewsContent(formData.contentBlocks)
      
      // Upload featured image if exists
      let imagePath = null
      if (formData.image) {
        const file = formData.image
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `news/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file)
        
        if (uploadError) {
          throw new Error('Error al subir imagen: ' + uploadError.message)
        }
        
        imagePath = filePath
      }

      // Prepare tags with category as first tag
      const allTags = formData.category ? [formData.category, ...formData.tags.filter(tag => tag !== formData.category)] : formData.tags

      // Prepare data for API
      const newsData = {
        title: formData.title,
        date: new Date(formData.date + 'T00:00:00Z').toISOString(),
        extract: formData.extract,
        text: JSON.stringify(processedContent),
        image: imagePath,
        tags: allTags,
        club_id: formData.club_id
      }
      
      // Determine the API endpoint based on permissions
      let apiEndpoint = '/api/news'
      if (!isAdmin && formData.club_id) {
        // Club admins use the club-specific endpoint
        apiEndpoint = `/api/clubs/${formData.club_id}/news`
      }

      // Call the API to create news
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Determine redirect path based on user type
      const redirectPath = isAdmin ? '/admin/noticias' : '/club-admin/noticias'
      
      // Add a small delay to ensure the creation is completed before redirecting
      setTimeout(() => {
        router.push(redirectPath)
        router.refresh()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la noticia'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Function to process content blocks before saving
  const processNewsContent = async (blocks: BlockContent[]) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
    }

    const processedBlocks = await Promise.all(blocks.map(async (block, index) => {
      if (block.type === BLOCK_TYPES.TEXT) {
        return {
          id: `block-${index}`,
          type: block.type,
          content: block.content
        }
      } 
      else if (block.type === BLOCK_TYPES.IMAGE) {
        let imagePath = null
        if (block.content.file) {
          const file = block.content.file
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `news/blocks/${fileName}`
          
          try {
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(filePath, file)
            
            if (uploadError) throw uploadError
            
            imagePath = filePath
          } catch (error) {
            console.error('Error uploading image for block', index, error)
          }
        }
        
        return {
          id: `block-${index}`,
          type: block.type,
          content: {
            src: imagePath,
            caption: block.content.caption,
            alignment: block.content.alignment
          }
        }
      } 
      else if (block.type === BLOCK_TYPES.CHESS_GAME) {
        return {
          id: `block-${index}`,
          type: block.type,
          content: {
            pgn: block.content.pgn,
            whitePlayer: block.content.whitePlayer,
            blackPlayer: block.content.blackPlayer
          }
        }
      }
      
      return null
    }))
    
    return processedBlocks.filter(block => block !== null)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }))
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: imageUrl
      }))
    }
  }

  // Block management functions
  const addTextBlock = () => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, { type: BLOCK_TYPES.TEXT, content: "" } as TextBlockContent]
    }))
  }

  const addImageBlock = () => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, {
        type: BLOCK_TYPES.IMAGE,
        content: {
          file: null,
          imageUrl: null,
          caption: "",
          alignment: IMAGE_ALIGNMENTS.CENTER,
        },
      } as ImageBlockContent]
    }))
  }

  const addChessGameBlock = () => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, {
        type: BLOCK_TYPES.CHESS_GAME,
        content: {
          pgn: "",
          whitePlayer: { type: "custom", value: "" },
          blackPlayer: { type: "custom", value: "" },
        },
      } as ChessGameBlockContent]
    }))
  }

  const updateTextBlock = (index: number, newContent: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.TEXT) {
      (updatedBlocks[index] as TextBlockContent).content = newContent
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateImageFile = (index: number, file: File, imageUrl: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBlocks[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        file: file,
        imageUrl: imageUrl,
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateImageCaption = (index: number, caption: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBlocks[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        caption: caption,
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateImageAlignment = (index: number, alignment: ImageAlignment) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBlocks[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        alignment: alignment,
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateChessGamePgn = (index: number, newPgn: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBlocks[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        pgn: newPgn,
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateChessGameWhitePlayer = (index: number, newValue: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBlocks[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        whitePlayer: {
          ...chessBlock.content.whitePlayer,
          value: newValue,
        },
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateChessGameBlackPlayer = (index: number, newValue: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBlocks[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        blackPlayer: {
          ...chessBlock.content.blackPlayer,
          value: newValue,
        },
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateChessGameWhitePlayerType = (index: number, newType: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBlocks[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        whitePlayer: {
          type: newType,
          value: "",
        },
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const updateChessGameBlackPlayerType = (index: number, newType: string) => {
    const updatedBlocks = [...formData.contentBlocks]
    if (updatedBlocks[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBlocks[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        blackPlayer: {
          type: newType,
          value: "",
        },
      }
    }
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const deleteBlock = (index: number) => {
    const updatedBlocks = formData.contentBlocks.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const moveBlockUp = (index: number) => {
    if (index === 0) return
    const updatedBlocks = [...formData.contentBlocks]
    const temp = updatedBlocks[index]
    updatedBlocks[index] = updatedBlocks[index - 1]
    updatedBlocks[index - 1] = temp
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
  }

  const moveBlockDown = (index: number) => {
    if (index === formData.contentBlocks.length - 1) return
    const updatedBlocks = [...formData.contentBlocks]
    const temp = updatedBlocks[index]
    updatedBlocks[index] = updatedBlocks[index + 1]
    updatedBlocks[index + 1] = temp
    setFormData(prev => ({ ...prev, contentBlocks: updatedBlocks }))
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
                <SelectItem value="torneos">Torneos</SelectItem>
                <SelectItem value="resultados">Resultados</SelectItem>
                <SelectItem value="institucional">Institucional</SelectItem>
                <SelectItem value="clases">Clases</SelectItem>
                <SelectItem value="eventos">Eventos</SelectItem>
                <SelectItem value="partidas">Partidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
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

          {/* Entity selection - unified for all users */}
          <div className="grid gap-2">
            <Label htmlFor="entity">Entidad</Label>
            <Select 
              value={formData.club_id?.toString() ?? 'fasgba'} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                club_id: value === 'fasgba' ? null : parseInt(value) 
              }))}
            >
              <SelectTrigger id="entity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* FASGBA option - only for site admins or when they have explicit permission */}
                {isAdmin && (
                  <SelectItem value="fasgba">FASGBA (Federación)</SelectItem>
                )}
                
                {/* Site admins can see all clubs */}
                {isAdmin && allClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
                
                {/* Club admins can only see their clubs */}
                {!isAdmin && userClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
                
                {/* If user is both site admin and club admin, show user clubs separately */}
                {isAdmin && userClubs.length > 0 && allClubs.length > 0 && (
                  <>
                    <SelectItem disabled value="separator" className="text-xs text-muted-foreground font-semibold">
                      ── Mis Clubes ──
                    </SelectItem>
                    {userClubs
                      .filter(userClub => !allClubs.some(allClub => allClub.id === userClub.id))
                      .map((club) => (
                        <SelectItem key={`user-${club.id}`} value={club.id.toString()}>
                          {club.name} *
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {formData.club_id ? 
                `La noticia estará asociada a ${isAdmin && allClubs.find(c => c.id === formData.club_id)?.name || userClubs.find(c => c.id === formData.club_id)?.name}` :
                'La noticia estará asociada a la Federación FASGBA'
              }
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Contenido</Label>
            <div className="border rounded-md p-4 space-y-4">
              {formData.contentBlocks.map((block, index) => {
                if (block.type === BLOCK_TYPES.TEXT) {
                  return (
                    <TextBlock
                      key={`text-${index}`}
                      value={block.content}
                      onChange={(newContent) => updateTextBlock(index, newContent)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.contentBlocks.length}
                    />
                  )
                } else if (block.type === BLOCK_TYPES.IMAGE) {
                  return (
                    <ImageBlock
                      key={`image-${index}`}
                      value={block.content}
                      onImageChange={(file, imageUrl) => updateImageFile(index, file, imageUrl)}
                      onCaptionChange={(caption) => updateImageCaption(index, caption)}
                      onAlignmentChange={(alignment) => updateImageAlignment(index, alignment)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.contentBlocks.length}
                    />
                  )
                } else if (block.type === BLOCK_TYPES.CHESS_GAME) {
                  return (
                    <ChessGameBlock
                      key={`chess-${index}`}
                      value={block.content}
                      onPgnChange={(newPgn) => updateChessGamePgn(index, newPgn)}
                      onWhitePlayerChange={(newValue) => updateChessGameWhitePlayer(index, newValue)}
                      onBlackPlayerChange={(newValue) => updateChessGameBlackPlayer(index, newValue)}
                      onWhitePlayerTypeChange={(newType) => updateChessGameWhitePlayerType(index, newType)}
                      onBlackPlayerTypeChange={(newType) => updateChessGameBlackPlayerType(index, newType)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.contentBlocks.length}
                    />
                  )
                }
                return null
              })}
              
              <AddBlockButton
                onAddTextBlock={addTextBlock}
                onAddImageBlock={addImageBlock}
                onAddChessGameBlock={addChessGameBlock}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 