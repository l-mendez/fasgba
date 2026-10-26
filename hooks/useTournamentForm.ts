"use client"

import { useState } from "react"
import type { TournamentFormData } from "@/lib/tournament-form-utils"

/** State and handlers for TournamentFormFields (create, edit and chess-results import). */
export function useTournamentForm(initial: TournamentFormData | (() => TournamentFormData)) {
  const [formData, setFormData] = useState<TournamentFormData>(initial)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const clearError = (name: string) => {
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearError(name)
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "tournament_type") {
      const type = value as "individual" | "team"
      setFormData((prev) => ({
        ...prev,
        tournament_type: type,
        ...(type === "individual" ? { players_per_team: "", max_teams: "", team_match_points: {} } : {}),
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    clearError(name)
  }

  const addDate = (date: string) => {
    if (!date || formData.dates.includes(date)) return
    setFormData((prev) => ({ ...prev, dates: [...prev.dates, date].sort() }))
    clearError("dates")
  }

  const removeDate = (date: string) => {
    setFormData((prev) => ({ ...prev, dates: prev.dates.filter((d) => d !== date) }))
  }

  return { formData, setFormData, validationErrors, setValidationErrors, handleChange, handleSelectChange, addDate, removeDate }
}
