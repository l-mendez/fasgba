'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiCall } from '@/lib/utils/apiClient'
import type { Player } from './types'

interface PlayerSearchFieldProps {
  id: string
  /** Selected player id; 0 means none. */
  value: number
  /** Display name of the selected player. */
  selectedLabel?: string
  onSelect: (player: Player | null) => void
}

// Search-as-you-type player lookup (same API as useTeamRoster) so any of the
// federation's players can be picked, not just the first page.
export function PlayerSearchField({ id, value, selectedLabel, onSelect }: PlayerSearchFieldProps) {
  const [query, setQuery] = useState('')
  // Results are tagged with their term so stale or pending searches are derived, not stored.
  const [fetched, setFetched] = useState<{ term: string; players: Player[] }>({ term: '', players: [] })
  const term = query.trim()
  const canSearch = term.length >= 2
  const searching = canSearch && fetched.term !== term
  const results = canSearch && fetched.term === term ? fetched.players : []

  useEffect(() => {
    if (!canSearch) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const data = await apiCall(`/api/players?search=${encodeURIComponent(term)}&limit=10`)
        if (!cancelled) setFetched({ term, players: data.players || [] })
      } catch (error) {
        console.error('Error searching players:', error)
        if (!cancelled) setFetched({ term, players: [] })
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, canSearch])

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
        <span className="truncate font-medium">{selectedLabel || `Jugador #${value}`}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          aria-label="Cambiar jugador"
          title="Cambiar jugador"
          onClick={() => onSelect(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder="Buscar por nombre o FIDE ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoComplete="off"
        />
        {searching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {results.length > 0 ? (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {results.map((player) => (
            <button
              key={player.id}
              type="button"
              className="w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              onClick={() => {
                onSelect(player)
                setQuery('')
              }}
            >
              <p className="text-sm font-medium">{player.full_name}</p>
              {(player.rating || player.club) && (
                <p className="text-xs text-muted-foreground">
                  {[player.rating, player.club?.name].filter(Boolean).join(' · ')}
                </p>
              )}
            </button>
          ))}
        </div>
      ) : canSearch && !searching ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : null}
    </div>
  )
}
