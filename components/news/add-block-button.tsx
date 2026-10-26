"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SimpleAddBlockButtonsProps {
  onAddTextBlock: () => void
  onAddImageBlock: () => void
  onAddChessGameBlock: () => void
  onBulkImageUpload?: () => void
  isUploading?: boolean
  layout?: "row" | "stack"
}

export function SimpleAddBlockButtons({
  onAddTextBlock,
  onAddImageBlock,
  onAddChessGameBlock,
  onBulkImageUpload,
  isUploading = false,
  layout = "row",
}: SimpleAddBlockButtonsProps) {
  const containerClass = layout === "stack"
    ? "flex flex-wrap gap-2 mt-4"
    : "flex flex-col sm:flex-row gap-2 mt-4"

  return (
    <div className={containerClass}>
      <Button type="button" variant="outline" onClick={onAddTextBlock} size="sm" className="text-sm w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Texto
      </Button>
      <Button type="button" variant="outline" onClick={onAddImageBlock} size="sm" className="text-sm w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Imagen
      </Button>
      <Button type="button" variant="outline" onClick={onAddChessGameBlock} size="sm" className="text-sm w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Partida de ajedrez
      </Button>
      {onBulkImageUpload && (
        <Button
          type="button"
          variant="outline"
          onClick={onBulkImageUpload}
          size="sm"
          className="text-sm w-full sm:w-auto"
          disabled={isUploading}
        >
          <Plus className="h-4 w-4" />
          Varias imágenes
        </Button>
      )}
    </div>
  )
}
