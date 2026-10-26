"use client"

import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

interface AdminConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** e.g. "¿Eliminar club?" */
  title: string
  description?: ReactNode
  /** Button label, named after the action (e.g. "Eliminar"). */
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  pending?: boolean
  destructive?: boolean
}

/**
 * Shared admin confirmation (AlertDialog). Stays open while `pending`; the
 * caller closes it (via `onOpenChange(false)` / its own state) when done.
 */
export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Eliminar",
  onConfirm,
  pending = false,
  destructive = true,
}: AdminConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: destructive ? "destructive" : "default" })}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
