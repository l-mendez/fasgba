import { cn } from "@/lib/utils"
import type { PlanStatus } from "@/lib/chess-results/plan"

const STYLES: Record<PlanStatus, { label: string; className: string }> = {
  new: { label: "Nuevo", className: "border-amber/50 bg-amber/15 text-terracotta" },
  fill: { label: "Se completa", className: "border-terracotta/30 bg-terracotta/10 text-terracotta" },
  exists: { label: "Ya cargado", className: "border-transparent bg-muted text-muted-foreground" },
  skip: { label: "No se importa", className: "border-terracotta bg-terracotta text-white" },
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
