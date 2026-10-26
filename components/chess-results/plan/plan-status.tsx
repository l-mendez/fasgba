import { cn } from "@/lib/utils"
import type { PlanStatus } from "@/lib/chess-results/plan"

const STYLES: Record<PlanStatus, { label: string; className: string }> = {
  new: { label: "Nuevo", className: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" },
  fill: { label: "Completa resultado", className: "border-amber/40 bg-amber/10 text-amber-dark" },
  exists: { label: "Ya cargado", className: "border-border bg-muted text-muted-foreground" },
  skip: { label: "No se importa", className: "border-destructive/30 bg-destructive/10 text-destructive" },
}

/** Small pill telling what the import does with an item. */
export function PlanStatusBadge({ status, label, className }: { status: PlanStatus; label?: string; className?: string }) {
  const style = STYLES[status]
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", style.className, className)}>
      {label ?? style.label}
    </span>
  )
}

export const RESULT_LABEL: Record<string, string> = { "1-0": "1 - 0", "0-1": "0 - 1", "1/2-1/2": "½ - ½", "*": "—" }
