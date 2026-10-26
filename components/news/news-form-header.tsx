"use client"

import React from "react"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"

interface NewsFormHeaderProps {
  title: string
  saveLabel: string
  savingLabel: string
  isSaving: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function NewsFormHeader({
  title,
  saveLabel,
  savingLabel,
  isSaving,
  onBack,
  onSubmit,
}: NewsFormHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver" title="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="truncate text-2xl font-bold tracking-tight text-terracotta md:text-3xl">{title}</h1>
      </div>
      <Button onClick={onSubmit} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </div>
  )
}
