"use client"

import { useState, useRef } from "react"
import { Trash2, MoveUp, MoveDown, ImageIcon, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { IMAGE_ALIGNMENTS, type ImageAlignment } from "@/components/news/types"
import type { ImageBlockContent } from "@/components/news/types"

interface ImageBlockEditorProps {
  value: ImageBlockContent['content']
  onImageChange: (file: File, imageUrl: string) => void
  onCaptionChange: (caption: string) => void
  onAlignmentChange: (alignment: ImageAlignment) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
}

export function ImageBlockEditor({
  value,
  onImageChange,
  onCaptionChange,
  onAlignmentChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalBlocks,
}: ImageBlockEditorProps) {
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
