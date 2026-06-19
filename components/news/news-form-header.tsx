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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">{title}</h1>
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </div>
  )
}
