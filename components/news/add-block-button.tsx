"use client"

import { useState } from "react"
import { Plus, ChevronDown, ImageIcon } from "lucide-react"
import { DiamondIcon as ChessIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface AddBlockButtonProps {
  onAddTextBlock: () => void
  onAddChessGameBlock: () => void
  onAddImageBlock: () => void
}

export function AddBlockButton({
  onAddTextBlock,
  onAddChessGameBlock,
  onAddImageBlock,
}: AddBlockButtonProps) {
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
    ? "flex space-x-2 mt-4"
    : "flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4"

  return (
    <div className={containerClass}>
      <Button type="button" variant="outline" onClick={onAddTextBlock} size="sm" className="text-sm w-full sm:w-auto">
        + Texto
      </Button>
      <Button type="button" variant="outline" onClick={onAddImageBlock} size="sm" className="text-sm w-full sm:w-auto">
        + Imagen
      </Button>
      <Button type="button" variant="outline" onClick={onAddChessGameBlock} size="sm" className="text-sm w-full sm:w-auto">
        + Partida de ajedrez
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
          + Múltiples Imágenes
        </Button>
      )}
    </div>
  )
}
