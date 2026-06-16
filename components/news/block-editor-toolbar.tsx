"use client"

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
  if (compact) {
    return (
      <div className="absolute right-2 top-2 flex space-x-2">
        <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} type="button">↑</Button>
        <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={index === totalBlocks - 1} type="button">↓</Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete} type="button">×</Button>
      </div>
    )
  }

  return (
    <div className="absolute right-2 top-2 flex space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        disabled={index === 0}
        type="button"
        className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        disabled={index === totalBlocks - 1}
        type="button"
        className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
      >
        ↓
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
        onClick={onDelete}
        type="button"
      >
        ×
      </Button>
    </div>
  )
}
