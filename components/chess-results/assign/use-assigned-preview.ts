"use client"

import { useEffect, useRef, useState } from "react"

import type { Assignments, PlayerChoice, TeamChoice } from "@/lib/chess-results/assign"
import type { ChessResultsOptions, ChessResultsPreview } from "@/lib/tournament/chess-results-dto"
import { apiCall } from "@/lib/utils/apiClient"

export interface PreviewState {
  preview: ChessResultsPreview | null
  loading: boolean
  error: string | null
}

const RECALC_DELAY_MS = 400

function withChoice<T>(map: Record<string, T> | undefined, key: string, choice: T | null) {
  const next = { ...map }
  if (choice) next[key] = choice
  else delete next[key]
  return next
}

/**
 * Preview of importing `tnr` (or syncing it into `tournamentId`) that follows the
 * admin's team/player assignments: every change recalculates the plan on the server.
 */
export function useAssignedPreview(tnr: number, tournamentId: number | null, initial?: ChessResultsPreview | null) {
  const [state, setState] = useState<PreviewState>({ preview: initial ?? null, loading: !initial, error: null })
  const [assignments, setAssignments] = useState<Assignments>({})
  const [updating, setUpdating] = useState(false)
  const request = useRef(0)
  const touched = useRef(false)

  useEffect(() => {
    if (initial) return
    let cancelled = false
    const query = `url=${tnr}${tournamentId ? `&tournamentId=${tournamentId}` : ""}`
    apiCall(`/api/chess-results/preview?${query}`)
      .then((preview: ChessResultsPreview) => !cancelled && setState({ preview, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ preview: null, loading: false, error: err instanceof Error ? err.message : "No se pudo leer chess-results" }))
    return () => { cancelled = true }
  }, [tnr, tournamentId, initial])

  useEffect(() => {
    if (!touched.current) return
    const id = ++request.current
    const timer = setTimeout(() => {
      apiCall("/api/chess-results/preview", { method: "POST", body: JSON.stringify({ url: tnr, tournamentId, assignments }) })
        .then((preview: ChessResultsPreview) => id === request.current && setState({ preview, loading: false, error: null }))
        .catch((err) => id === request.current && setState((s) => ({ ...s, error: err instanceof Error ? err.message : "No se pudo recalcular" })))
        .finally(() => id === request.current && setUpdating(false))
    }, RECALC_DELAY_MS)
    return () => clearTimeout(timer)
  }, [assignments, tnr, tournamentId])

  const update = (fn: (a: Assignments) => Assignments) => {
    touched.current = true
    setUpdating(true)
    setAssignments(fn)
  }

  return {
    state,
    assignments,
    updating,
    setTeam: (key: string, choice: TeamChoice | null) => update((a) => ({ ...a, teams: withChoice(a.teams, key, choice) })),
    setPlayer: (key: string, choice: PlayerChoice | null) => update((a) => ({ ...a, players: withChoice(a.players, key, choice) })),
    setGuestClub: (name: string, guest: boolean) => update((a) => {
      const rest = (a.guestClubs ?? []).filter((n) => n !== name)
      return { ...a, guestClubs: guest ? [...rest, name] : rest }
    }),
  }
}

export type AssignedPreview = ReturnType<typeof useAssignedPreview>

let optionsCache: Promise<ChessResultsOptions> | null = null

/** Site teams, clubs and players for the pickers (loaded once per page). */
export function useChessResultsOptions(refresh = false) {
  const [options, setOptions] = useState<ChessResultsOptions | null>(null)
  useEffect(() => {
    if (refresh || !optionsCache) optionsCache = apiCall("/api/chess-results/options")
    let cancelled = false
    optionsCache.then((o) => !cancelled && setOptions(o)).catch(() => { optionsCache = null })
    return () => { cancelled = true }
  }, [refresh])
  return options
}
