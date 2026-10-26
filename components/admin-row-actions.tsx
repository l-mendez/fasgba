"use client"

import Link from "next/link"
import { MoreHorizontal, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface AdminRowAction {
  label: string
  icon: LucideIcon
  href?: string
  /** Open `href` in a new tab (e.g. public page). */
  external?: boolean
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
}

interface AdminRowActionsProps {
  actions: AdminRowAction[]
  className?: string
}

/** Shared "…" row menu for admin tables. Destructive items render last. */
export function AdminRowActions({ actions, className }: AdminRowActionsProps) {
  const visible = actions.filter((action) => !action.hidden)
  const regular = visible.filter((action) => !action.destructive)
  const destructive = visible.filter((action) => action.destructive)

  const renderItem = (action: AdminRowAction) => {
    const Icon = action.icon
    const content = (
      <>
        <Icon className="mr-2 h-4 w-4" />
        {action.label}
      </>
    )

    return (
      <DropdownMenuItem
        key={action.label}
        asChild={Boolean(action.href)}
        disabled={action.disabled}
        onSelect={action.onSelect}
        className={cn(action.destructive && "text-destructive focus:text-destructive")}
      >
        {action.href ? (
          <Link
            href={action.href}
            {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", className)}
          aria-label="Acciones"
          title="Acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {regular.map(renderItem)}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
