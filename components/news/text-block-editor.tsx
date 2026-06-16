"use client"

import { Trash2, MoveUp, MoveDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { BlockEditorToolbar } from "@/components/news/block-editor-toolbar"

interface TextBlockEditorProps {
  value: string
  onChange: (value: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
  variant?: "default" | "simple"
}

export function TextBlockEditor({
  value,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalBlocks,
  variant = "default",
}: TextBlockEditorProps) {
  if (variant === "simple") {
    return (
      <div className="border rounded-md p-3 md:p-4 relative">
        <BlockEditorToolbar
          index={index}
          totalBlocks={totalBlocks}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
        />
        <div className="pt-8 md:pt-6">
          <RichTextEditor
            content={value}
            onChange={onChange}
            placeholder="Escribe el contenido aquí..."
          />
        </div>
      </div>
    )
  }

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
      <RichTextEditor
        content={value}
        onChange={onChange}
        placeholder="Escribe el contenido aquí..."
      />
    </div>
  )
}
