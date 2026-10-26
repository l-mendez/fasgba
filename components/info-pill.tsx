import type { LucideIcon } from "lucide-react"

// Neutral outlined pill (icon + label) for statuses and categories, so tags
// don't introduce colors outside the site palette.
export function InfoPill({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}
