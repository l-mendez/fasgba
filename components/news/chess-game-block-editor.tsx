"use client"

import { useState } from "react"
import { Trash2, MoveUp, MoveDown, ChevronDown, ChevronUp } from "lucide-react"
import { DiamondIcon as ChessIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PlayerSelector } from "@/components/news/player-selector"
import { BlockEditorToolbar } from "@/components/news/block-editor-toolbar"
import type { ChessGameBlockContent } from "@/components/news/types"

interface ChessGameBlockEditorProps {
  value: ChessGameBlockContent['content']
  onPgnChange: (pgn: string) => void
  onWhitePlayerChange: (value: string) => void
  onBlackPlayerChange: (value: string) => void
  onWhitePlayerTypeChange: (type: string) => void
  onBlackPlayerTypeChange: (type: string) => void
  onResultChange: (result: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  index: number
  totalBlocks: number
  variant?: "default" | "simple"
}

export function ChessGameBlockEditor({
  value,
  onPgnChange,
  onWhitePlayerChange,
  onBlackPlayerChange,
  onWhitePlayerTypeChange,
  onBlackPlayerTypeChange,
  onResultChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalBlocks,
  variant = "default",
}: ChessGameBlockEditorProps) {
  const [isOpen, setIsOpen] = useState(true)

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
        <div className="pt-8 md:pt-6 space-y-2">
          <Textarea
            placeholder="PGN (notación)"
            value={value.pgn || ''}
            onChange={(e) => onPgnChange(e.target.value)}
            className="min-h-[100px] md:min-h-[120px] text-sm md:text-base"
          />
          <Input
            placeholder="Jugador blanco"
            value={value.whitePlayer?.value || ''}
            onChange={(e) => onWhitePlayerChange(e.target.value)}
            className="text-sm md:text-base"
          />
          <Input
            placeholder="Jugador negro"
            value={value.blackPlayer?.value || ''}
            onChange={(e) => onBlackPlayerChange(e.target.value)}
            className="text-sm md:text-base"
          />
          <div className="space-y-2">
            <Label htmlFor={`result-${index}`} className="text-sm md:text-sm font-medium">Resultado</Label>
            <Select value={value.result || "1-0"} onValueChange={onResultChange}>
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
      </div>
    )
  }

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
              onChange={onWhitePlayerChange}
              onTypeChange={onWhitePlayerTypeChange}
            />

            <PlayerSelector
              label="Jugador con negras"
              type={value.blackPlayer.type}
              value={value.blackPlayer.value}
              onChange={onBlackPlayerChange}
              onTypeChange={onBlackPlayerTypeChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`result-${index}`}>Resultado</Label>
            <Select value={value.result || "1-0"} onValueChange={onResultChange}>
              <SelectTrigger id={`result-${index}`}>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
