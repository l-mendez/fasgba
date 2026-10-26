import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"

// Rating (or points) change since the previous ranking, with an up/down arrow.
// Renders nothing when there is no change.
export function RatingChange({ value, className }: { value: number | null | undefined; className?: string }) {
  const rounded = Math.round(value ?? 0)
  if (rounded === 0) return null

  const up = rounded > 0
  const Icon = up ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium",
        up ? "text-amber-dark dark:text-amber-light" : "text-destructive",
        className
      )}
      title={`${up ? "Subió" : "Bajó"} ${Math.abs(rounded)} puntos`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(rounded)}
    </span>
  )
}
