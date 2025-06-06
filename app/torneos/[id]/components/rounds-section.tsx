"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Play } from "lucide-react"
import Link from "next/link"

interface Game {
  id: number
  round: number
  white: string
  black: string
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  whiteRating?: number
  blackRating?: number
  board?: number
}

interface RoundsSectionProps {
  totalRounds: number
  gamesByRound: Record<number, Game[]>
  tournamentId: number
}

export default function RoundsSection({ totalRounds, gamesByRound, tournamentId }: RoundsSectionProps) {
  const [selectedRound, setSelectedRound] = useState<string>("1")
  
  const roundNumber = parseInt(selectedRound)
  const roundGames = gamesByRound[roundNumber] || []

  return (
    <div className="lg:col-span-7">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-terracotta" />
            <h2 className="text-xl font-bold text-terracotta">Rondas del Torneo</h2>
          </div>
          
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-32 border-amber/20 focus:ring-amber">
              <SelectValue placeholder="Ronda" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: totalRounds}, (_, i) => i + 1).map(roundNum => (
                <SelectItem key={roundNum} value={roundNum.toString()}>
                  Ronda {roundNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Card className="border-amber/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-terracotta text-lg">Ronda {roundNumber}</CardTitle>
            <CardDescription>
              {roundGames?.some(g => g.result === '*') 
                ? 'Partidas en curso' 
                : roundGames?.length > 0 
                  ? 'Partidas finalizadas'
                  : 'Ronda aún no programada'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {roundGames?.map(game => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-amber/10 hover:bg-amber/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {game.board}
                    </Badge>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium truncate">{game.white}</span>
                        {game.whiteRating && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({game.whiteRating})
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium truncate">{game.black}</span>
                        {game.blackRating && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({game.blackRating})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={game.result === '*' ? 'default' : 'outline'}
                      className={`flex-shrink-0 ${
                        game.result === '*' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'border-amber'
                      }`}
                    >
                      {game.result === '*' ? 'En juego' : game.result}
                    </Badge>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs hover:bg-amber/10 hover:text-terracotta"
                    >
                      <Link href={`/torneos/${tournamentId}/partidas/${game.id}`}>
                        <Play className="h-3 w-3 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-8">
                  {totalRounds >= roundNumber 
                    ? 'Ronda aún no programada' 
                    : 'Esta ronda no existe en el torneo'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 