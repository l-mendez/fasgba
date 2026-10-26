"use client"

import { ChevronDown, ChevronUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BlockEditorToolbarProps {
  index: number
  totalBlocks: number
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  compact?: boolean
}

export function BlockEditorToolbar({
  index,
  totalBlocks,
  onMoveUp,
  onMoveDown,
  onDelete,
  compact = false,
}: BlockEditorToolbarProps) {
  const size = compact ? "h-8 w-8" : "h-7 w-7 md:h-8 md:w-8"

  return (
    <div className="absolute right-2 top-2 flex gap-1">
      <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0} type="button" className={size} aria-label="Subir" title="Subir">
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={index === totalBlocks - 1} type="button" className={size} aria-label="Bajar" title="Bajar">
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} type="button" className={`${size} text-destructive hover:text-destructive`} aria-label="Eliminar" title="Eliminar">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
