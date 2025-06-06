"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the ChessBoard component
const ChessBoard = dynamic(() => import('@/app/components/chess-board'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] sm:h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-lg">
      <span className="text-muted-foreground text-sm">Cargando tablero...</span>
    </div>
  )
})

interface GameDetails {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
  fen?: string
  pgn?: string
  date?: string
  time?: string
}

interface ChessGameDisplayProps {
  game: GameDetails
}

export default function ChessGameDisplay({ game }: ChessGameDisplayProps) {
  const handleCopyPGN = async () => {
    if (!game.pgn) return
    
    try {
      await navigator.clipboard.writeText(game.pgn)
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

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Chess Board */}
      <div className="lg:col-span-7">
        <Card className="border-amber/20">
          <CardHeader>
            <CardTitle className="text-terracotta">Tablero de Juego</CardTitle>
            <CardDescription>
              Posición actual de la partida
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChessBoard 
              fen={game.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
              pgn={game.pgn}
              whitePlayer={{ type: 'custom', value: game.white }}
              blackPlayer={{ type: 'custom', value: game.black }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Game Information */}
      <div className="lg:col-span-5">
        <div className="space-y-6">
          {/* Players Info */}
          <Card className="border-amber/20">
            <CardHeader>
              <CardTitle className="text-terracotta">Jugadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400"></div>
                  <div>
                    <div className="font-medium">{game.white}</div>
                    {game.whiteRating && (
                      <div className="text-sm text-muted-foreground">Rating: {game.whiteRating}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-black border-2 border-gray-300"></div>
                  <div>
                    <div className="font-medium">{game.black}</div>
                    {game.blackRating && (
                      <div className="text-sm text-muted-foreground">Rating: {game.blackRating}</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Details */}
          <Card className="border-amber/20">
            <CardHeader>
              <CardTitle className="text-terracotta">Detalles de la Partida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ronda:</span>
                <span className="font-medium">{game.round}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mesa:</span>
                <span className="font-medium">{game.board}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <Badge 
                  variant={game.result === '*' ? 'default' : 'outline'}
                  className={
                    game.result === '*' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'border-amber'
                  }
                >
                  {game.result === '*' ? 'En juego' : 'Finalizada'}
                </Badge>
              </div>
              {game.result !== '*' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resultado:</span>
                  <span className="font-medium">{game.result}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PGN Section */}
          {game.pgn && (
            <Card className="border-amber/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-terracotta">PGN</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPGN}
                    className="text-amber hover:bg-amber/10"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-md overflow-x-auto">
                  {game.pgn}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 