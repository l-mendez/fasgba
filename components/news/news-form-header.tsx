"use client"

import Link from "next/link"
import { ArrowLeft, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"

interface NewsFormHeaderProps {
  title: string
  backHref: string
}

export function NewsFormHeader({ title, backHref }: NewsFormHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link href={backHref} aria-label="Volver" title="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <h1 className="truncate text-2xl font-bold tracking-tight text-terracotta md:text-3xl">{title}</h1>
    </div>
  )
}

interface NewsFormActionsProps {
  cancelHref: string
  saveLabel: string
  savingLabel: string
  isSaving: boolean
}

/** Form footer: right-aligned [Cancelar][Guardar], sticky on mobile. Place inside the <form>. */
export function NewsFormActions({ cancelHref, saveLabel, savingLabel, isSaving }: NewsFormActionsProps) {
  return (
    <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background py-3 md:static md:border-0 md:py-0">
      <Button variant="outline" asChild>
        <Link href={cancelHref}>Cancelar</Link>
      </Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </div>
  )
}
