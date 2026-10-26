"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import dynamic from "next/dynamic"
import { GameDisplay } from "@/lib/gameUtils-client"

// Dynamically import the ChessBoard component
const ChessBoard = dynamic(() => import('@/app/components/chess-board'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] sm:h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-lg">
      <span className="text-muted-foreground text-sm">Cargando tablero...</span>
    </div>
  )
})

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

// Board bar label: name plus rating, so no separate player card is needed.
const playerLabel = (name: string, rating?: number) => (rating ? `${name} (${rating})` : name)

interface ChessGameDisplayProps {
  game: GameDisplay
}

export default function ChessGameDisplay({ game }: ChessGameDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyPGN = async () => {
    if (!game.pgn) return

    try {
      await navigator.clipboard.writeText(game.pgn)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy PGN:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = game.pgn
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const hasPosition = Boolean(game.fen && game.fen !== START_FEN)
  if (!game.pgn && !hasPosition) {
    return (
      <p className="max-w-3xl rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Partida sin movimientos cargados.
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="flex justify-center rounded-lg border bg-card p-4 lg:col-span-7">
        <ChessBoard
          fen={game.fen || START_FEN}
          pgn={game.pgn}
          whitePlayer={{ type: 'custom', value: playerLabel(game.white, game.whiteRating) }}
          blackPlayer={{ type: 'custom', value: playerLabel(game.black, game.blackRating) }}
          result={game.result}
          width={400}
        />
      </div>

      <div className="lg:col-span-5">
        {game.pgn && (
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">PGN</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyPGN}
                aria-label="Copiar PGN"
                title="Copiar PGN"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
              {game.pgn}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
