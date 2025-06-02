"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft as ChevronLeft,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Trash2,
  MoveUp,
  MoveDown,
  DiamondIcon as ChessIcon,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertCircle,
  Save
} from "lucide-react"
import { Chess } from "chess.js"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { X } from "lucide-react"

// Tipos de bloques de contenido
const BLOCK_TYPES = {
  TEXT: "text",
  CHESS_GAME: "chess_game",
  IMAGE: "image",
} as const

// Alineaciones de imagen
const IMAGE_ALIGNMENTS = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const

// TypeScript types
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

interface FormData {
  titulo: string
  extracto: string
  categoria: string
  imagen: File | null
  imagenPreview: string | null
  publicarAhora: boolean
  bloques: BlockContent[]
}

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

// Componente para visualizar el tablero de ajedrez
const ChessBoard = ({ pgn }: { pgn: string }) => {
  const [position, setPosition] = useState<string | null>(null)
  const [currentMove, setCurrentMove] = useState(0)
  const [moves, setMoves] = useState<Array<{ number: number; white: string; black: string }>>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!pgn) return

    try {
      const chess = new Chess()
      chess.loadPgn(pgn)

      // Guardar la posición inicial
      const history = chess.history({ verbose: true })
      const allPositions = [chess.fen()]

      // Revertir a la posición inicial
      chess.reset()

      // Generar todas las posiciones
      const allMoves: Array<{ number: number; white: string; black: string }> = []
      for (let i = 0; i < history.length; i++) {
        chess.move(history[i])
        allPositions.push(chess.fen())

        // Guardar la notación de cada movimiento
        if (i % 2 === 0) {
          allMoves.push({
            number: Math.floor(i / 2) + 1,
            white: history[i].san,
            black: i + 1 < history.length ? history[i + 1].san : "",
          })
        }
      }

      setMoves(allMoves)
      setPosition(allPositions[0])
      setCurrentMove(0)
      setError("")
    } catch (e) {
      setError("Error al cargar la notación PGN. Verifique que sea válida.")
      console.error(e)
    }
  }, [pgn])

  const handleMoveChange = (moveIndex: number) => {
    if (!moves.length) return
    setCurrentMove(moveIndex)
    // Aquí actualizaríamos la posición del tablero
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  // Renderizado simplificado del tablero (en producción usaríamos una biblioteca como react-chessboard)
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-2/3 bg-gray-100 aspect-square flex items-center justify-center">
        <div className="text-center">
          {position ? (
            <div className="text-sm">
              <div className="font-mono text-xs block mt-2 bg-gray-200 p-2 rounded">{position.substring(0, 30)}...</div>
              <p className="mt-4 text-xs text-muted-foreground">
                En producción, este componente utilizaría react-chessboard u otra biblioteca similar para mostrar el
                tablero real.
              </p>
            </div>
          ) : (
            <p>Cargando tablero...</p>
          )}
        </div>
      </div>

      <div className="w-full md:w-1/3">
        <h3 className="font-medium mb-2">Movimientos</h3>
        <div className="bg-gray-50 p-2 rounded max-h-[300px] overflow-y-auto">
          {moves.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              <div className="font-medium text-sm">#</div>
              <div className="font-medium text-sm">Blancas</div>
              <div className="font-medium text-sm">Negras</div>

              {moves.map((move, index) => (
                <>
                  <div key={`num-${index}`} className="text-sm text-gray-500">
                    {move.number}.
                  </div>
                  <button
                    key={`white-${index}`}
                    className={`text-sm text-left px-1 hover:bg-gray-200 rounded ${currentMove === index * 2 + 1 ? "bg-blue-100" : ""}`}
                    onClick={() => handleMoveChange(index * 2 + 1)}
                  >
                    {move.white}
                  </button>
                  <button
                    key={`black-${index}`}
                    className={`text-sm text-left px-1 hover:bg-gray-200 rounded ${currentMove === index * 2 + 2 ? "bg-blue-100" : ""}`}
                    onClick={() => handleMoveChange(index * 2 + 2)}
                  >
                    {move.black}
                  </button>
                </>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay movimientos para mostrar</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para seleccionar jugadores
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
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; elo: number }>>([])

  // Simulación de búsqueda de usuarios
  useEffect(() => {
    if (type === "user" && searchTerm.length > 2) {
      // En producción, esto sería una llamada a la API
      const mockResults = [
        { id: "1", name: "Juan Pérez", elo: 1850 },
        { id: "2", name: "María García", elo: 2100 },
        { id: "3", name: "Carlos López", elo: 1750 },
        { id: "4", name: "Ana Martínez", elo: 2200 },
      ].filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))

      setSearchResults(mockResults)
    }
  }, [searchTerm, type])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col space-y-2 p-3 border rounded-md">
        <RadioGroup value={type} onValueChange={onTypeChange} className="flex space-x-4">
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="user" id={`user-${label}`} />
            <Label htmlFor={`user-${label}`}>Usuario</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="custom" id={`custom-${label}`} />
            <Label htmlFor={`custom-${label}`}>Nombre personalizado</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="anonymous" id={`anonymous-${label}`} />
            <Label htmlFor={`anonymous-${label}`}>Anónimo</Label>
          </div>
        </RadioGroup>

        {type === "user" && (
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchResults.length > 0 && searchTerm.length > 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                      onClick={() => {
                        onChange(user.id)
                        setSearchTerm("")
                      }}
                    >
                      <span>{user.name}</span>
                      <Badge variant="outline">{user.elo}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {value && (
              <div className="bg-gray-50 p-2 rounded">
                {/* En producción, esto mostraría los detalles del usuario seleccionado */}
                <p className="text-sm">Usuario seleccionado: ID {value}</p>
              </div>
            )}
          </div>
        )}

        {type === "custom" && (
          <Input placeholder="Nombre del jugador" value={value || ""} onChange={(e) => onChange(e.target.value)} />
        )}

        {type === "anonymous" && <p className="text-sm text-muted-foreground">El jugador aparecerá como "Anónimo"</p>}
      </div>
    </div>
  )
}

// Componente para un bloque de texto
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

// Componente para un bloque de imagen
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

    // Crear una URL para previsualizar la imagen
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
                    src={preview || "/placeholder.svg"}
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

// Componente para un bloque de partida de ajedrez
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
  const [previewPgn, setPreviewPgn] = useState("")

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
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setPreviewPgn(value.pgn)}>
                    <Eye className="mr-1 h-4 w-4" />
                    Previsualizar tablero
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Previsualización de la partida</DialogTitle>
                    <DialogDescription>Vista previa del tablero y los movimientos de la partida</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <ChessBoard pgn={previewPgn} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

// Componente para añadir un nuevo bloque
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
          <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border overflow-hidden">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
              onClick={() => {
                onAddTextBlock()
                setIsOpen(false)
              }}
              type="button"
            >
              <span>Texto</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
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
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
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

export default function NewNewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    extracto: "",
    categoria: "",
    imagen: null,
    imagenPreview: null,
    publicarAhora: true,
    bloques: [
      // Iniciar con un bloque de texto vacío
      { type: BLOCK_TYPES.TEXT, content: "" } as TextBlockContent,
    ],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement
    
    if (name === "imagen" && files && files[0]) {
      const file = files[0]
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ 
        ...prev, 
        imagen: file,
        imagenPreview: imageUrl
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log('Starting news creation process...')
      
      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Error al verificar la sesión: ' + sessionError.message)
      }
      
      if (!session?.access_token) {
        console.error('No session or access token found')
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      }
      
      console.log('Session found:', { 
        userId: session.user.id, 
        email: session.user.email
      })
      
      // 1. Process content blocks (upload images if needed)
      const processedContent = await processNewsContent(formData.bloques)
      
      // 2. Upload featured image if exists
      let imagePath = null
      if (formData.imagen) {
        const file = formData.imagen
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
      
      // 3. Prepare data for API
      const newsData = {
        title: formData.titulo,
        extract: formData.extracto,
        text: JSON.stringify(processedContent),
        image: imagePath,
        tags: formData.categoria ? [formData.categoria] : [],
        // club_id can be added here if needed
      }
      
      console.log('Calling API to create news...')
      
      // 4. Call the API to create news
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newsData),
      })
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const newsItem = await response.json()
      console.log('News created successfully:', newsItem)
      
      // 5. Show success message and redirect
      toast({
        title: "Noticia creada",
        description: `La noticia "${formData.titulo}" ha sido creada exitosamente.`,
        duration: 5000,
      })
      
      router.push("/admin/noticias")
      
    } catch (err) {
      console.error('Error al crear noticia:', err)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al crear la noticia')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Función para procesar el contenido antes de guardar
  const processNewsContent = async (bloques: BlockContent[]) => {
    // Get session once for all image uploads
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
    }

    // Convertir los bloques en un formato adecuado para guardar
    const processedBlocks = await Promise.all(bloques.map(async (bloque, index) => {
      if (bloque.type === BLOCK_TYPES.TEXT) {
        return {
          id: `block-${index}`,
          type: bloque.type,
          content: bloque.content
        }
      } 
      else if (bloque.type === BLOCK_TYPES.IMAGE) {
        // Subir imagen si existe
        let imagePath = null
        if (bloque.content.file) {
          const file = bloque.content.file
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
          type: bloque.type,
          content: {
            src: imagePath,
            caption: bloque.content.caption,
            alignment: bloque.content.alignment
          }
        }
      } 
      else if (bloque.type === BLOCK_TYPES.CHESS_GAME) {
        return {
          id: `block-${index}`,
          type: bloque.type,
          content: {
            pgn: bloque.content.pgn,
            whitePlayer: bloque.content.whitePlayer,
            blackPlayer: bloque.content.blackPlayer
          }
        }
      }
      
      return null
    }))
    
    return processedBlocks.filter(block => block !== null)
  }

  // Funciones para manejar los bloques
  const addTextBlock = () => {
    setFormData((prev) => ({
      ...prev,
      bloques: [...prev.bloques, { type: BLOCK_TYPES.TEXT, content: "" } as TextBlockContent],
    }))
  }

  const addImageBlock = () => {
    setFormData((prev) => ({
      ...prev,
      bloques: [
        ...prev.bloques,
        {
          type: BLOCK_TYPES.IMAGE,
          content: {
            file: null,
            imageUrl: null,
            caption: "",
            alignment: IMAGE_ALIGNMENTS.CENTER,
          },
        } as ImageBlockContent,
      ],
    }))
  }

  const addChessGameBlock = () => {
    setFormData((prev) => ({
      ...prev,
      bloques: [
        ...prev.bloques,
        {
          type: BLOCK_TYPES.CHESS_GAME,
          content: {
            pgn: "",
            whitePlayer: { type: "user", value: "" },
            blackPlayer: { type: "user", value: "" },
          },
        } as ChessGameBlockContent,
      ],
    }))
  }

  const updateTextBlock = (index: number, newContent: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.TEXT) {
      (updatedBloques[index] as TextBlockContent).content = newContent
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateImageFile = (index: number, file: File, imageUrl: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBloques[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        file: file,
        imageUrl: imageUrl,
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateImageCaption = (index: number, caption: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBloques[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        caption: caption,
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateImageAlignment = (index: number, alignment: ImageAlignment) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.IMAGE) {
      const imageBlock = updatedBloques[index] as ImageBlockContent
      imageBlock.content = {
        ...imageBlock.content,
        alignment: alignment,
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateChessGamePgn = (index: number, newPgn: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBloques[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        pgn: newPgn,
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateChessGameWhitePlayer = (index: number, newValue: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBloques[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        whitePlayer: {
          ...chessBlock.content.whitePlayer,
          value: newValue,
        },
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateChessGameBlackPlayer = (index: number, newValue: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBloques[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        blackPlayer: {
          ...chessBlock.content.blackPlayer,
          value: newValue,
        },
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateChessGameWhitePlayerType = (index: number, newType: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBloques[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        whitePlayer: {
          type: newType,
          value: "", // Resetear el valor al cambiar el tipo
        },
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const updateChessGameBlackPlayerType = (index: number, newType: string) => {
    const updatedBloques = [...formData.bloques]
    if (updatedBloques[index].type === BLOCK_TYPES.CHESS_GAME) {
      const chessBlock = updatedBloques[index] as ChessGameBlockContent
      chessBlock.content = {
        ...chessBlock.content,
        blackPlayer: {
          type: newType,
          value: "", // Resetear el valor al cambiar el tipo
        },
      }
    }
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const deleteBlock = (index: number) => {
    const updatedBloques = formData.bloques.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const moveBlockUp = (index: number) => {
    if (index === 0) return
    const updatedBloques = [...formData.bloques]
    const temp = updatedBloques[index]
    updatedBloques[index] = updatedBloques[index - 1]
    updatedBloques[index - 1] = temp
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  const moveBlockDown = (index: number) => {
    if (index === formData.bloques.length - 1) return
    const updatedBloques = [...formData.bloques]
    const temp = updatedBloques[index]
    updatedBloques[index] = updatedBloques[index + 1]
    updatedBloques[index + 1] = temp
    setFormData((prev) => ({ ...prev, bloques: updatedBloques }))
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/noticias">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Nueva Noticia</h1>
          <p className="text-muted-foreground">Crea una nueva noticia para FASGBA.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información de la noticia</CardTitle>
            <CardDescription>Completa los campos para crear una nueva noticia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extracto">Extracto</Label>
              <Textarea
                id="extracto"
                name="extracto"
                value={formData.extracto}
                onChange={handleChange}
                placeholder="Breve resumen de la noticia"
                className="resize-none"
                rows={2}
                required
              />
              <p className="text-xs text-muted-foreground">
                Este texto se mostrará en las tarjetas de noticias y en los resultados de búsqueda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(value) => handleSelectChange("categoria", value)}>
                  <SelectTrigger id="categoria">
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

              <div className="space-y-2">
                <Label htmlFor="imagen">Imagen destacada</Label>
                <div className="flex flex-col space-y-2">
                  <Input
                    id="imagen"
                    name="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  {formData.imagenPreview && (
                    <div className="mt-2">
                      <img 
                        src={formData.imagenPreview} 
                        alt="Vista previa" 
                        className="max-h-[150px] rounded-md object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Imagen que se mostrará como cabecera de la noticia. Recomendado: 1200x600px.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Contenido de la noticia</h3>

              {/* Bloques de contenido */}
              {formData.bloques.map((bloque, index) => {
                if (bloque.type === BLOCK_TYPES.TEXT) {
                  return (
                    <TextBlock
                      key={`text-${index}`}
                      value={bloque.content}
                      onChange={(newContent) => updateTextBlock(index, newContent)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.bloques.length}
                    />
                  )
                } else if (bloque.type === BLOCK_TYPES.IMAGE) {
                  return (
                    <ImageBlock
                      key={`image-${index}`}
                      value={bloque.content}
                      onImageChange={(file, imageUrl) => updateImageFile(index, file, imageUrl)}
                      onCaptionChange={(caption) => updateImageCaption(index, caption)}
                      onAlignmentChange={(alignment) => updateImageAlignment(index, alignment)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.bloques.length}
                    />
                  )
                } else if (bloque.type === BLOCK_TYPES.CHESS_GAME) {
                  return (
                    <ChessGameBlock
                      key={`chess-${index}`}
                      value={bloque.content}
                      onPgnChange={(newPgn) => updateChessGamePgn(index, newPgn)}
                      onWhitePlayerChange={(newValue) => updateChessGameWhitePlayer(index, newValue)}
                      onBlackPlayerChange={(newValue) => updateChessGameBlackPlayer(index, newValue)}
                      onWhitePlayerTypeChange={(newType) => updateChessGameWhitePlayerType(index, newType)}
                      onBlackPlayerTypeChange={(newType) => updateChessGameBlackPlayerType(index, newType)}
                      onDelete={() => deleteBlock(index)}
                      onMoveUp={() => moveBlockUp(index)}
                      onMoveDown={() => moveBlockDown(index)}
                      index={index}
                      totalBlocks={formData.bloques.length}
                    />
                  )
                }
                return null
              })}

              {/* Botón para añadir nuevos bloques */}
              <AddBlockButton
                onAddTextBlock={addTextBlock}
                onAddImageBlock={addImageBlock}
                onAddChessGameBlock={addChessGameBlock}
              />
            </div>

            
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/admin/noticias">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publicando..." : "Publicar noticia"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 