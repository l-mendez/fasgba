import { ArrowDown, ArrowUp } from "lucide-react"

interface AdminSortIconProps {
  direction: "asc" | "desc" | null | undefined
}

/** Sort direction indicator for admin table headers and sort menus. */
export function AdminSortIcon({ direction }: AdminSortIconProps) {
  if (direction === "asc") return <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
  if (direction === "desc") return <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
  return null
}
