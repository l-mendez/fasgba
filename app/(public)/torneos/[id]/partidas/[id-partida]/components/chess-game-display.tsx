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

  const players = [
    { side: "Blancas", name: game.white, rating: game.whiteRating, team: game.whiteTeam, dot: "bg-white" },
    { side: "Negras", name: game.black, rating: game.blackRating, team: game.blackTeam, dot: "bg-black" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="flex justify-center rounded-lg border bg-card p-4 lg:col-span-7">
        <ChessBoard
          fen={game.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
          pgn={game.pgn}
          whitePlayer={{ type: 'custom', value: game.white }}
          blackPlayer={{ type: 'custom', value: game.black }}
          result={game.result}
          width={400}
        />
      </div>

      <div className="space-y-4 lg:col-span-5">
        <ul className="divide-y rounded-lg border bg-card">
          {players.map((player) => (
            <li key={player.side} className="flex items-center gap-3 p-4">
              <span className={`h-4 w-4 shrink-0 rounded-full border border-muted-foreground ${player.dot}`} title={player.side} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{player.name}</p>
                {player.team && <p className="truncate text-sm text-muted-foreground">{player.team}</p>}
              </div>
              {player.rating ? <span className="text-sm font-semibold tabular-nums">{player.rating}</span> : null}
            </li>
          ))}
        </ul>

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
