"use client"

import type { ReactNode } from "react"

import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ReviewDialogContentProps {
  title: string
  description?: ReactNode
  /** Blocks closing (Esc / outside click) while saving. */
  busy?: boolean
  footer: ReactNode
  children: ReactNode
}

/**
 * Dialog layout for the chess-results flows: full screen on phones, wide on
 * desktop, with the header and the actions always visible and only the body
 * scrolling.
 */
export function ReviewDialogContent({ title, description, busy, footer, children }: ReviewDialogContentProps) {
  return (
    <DialogContent
      className="flex h-[100dvh] max-h-[100dvh] max-w-none flex-col gap-0 p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl"
      onEscapeKeyDown={(e) => busy && e.preventDefault()}
      onInteractOutside={(e) => busy && e.preventDefault()}
    >
      <DialogHeader className="border-b px-4 py-3 pr-12 text-left sm:px-6">
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      <DialogFooter className="gap-2 border-t bg-background px-4 py-3 sm:px-6">{footer}</DialogFooter>
    </DialogContent>
  )
}
