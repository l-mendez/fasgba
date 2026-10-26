import { ExternalLink } from "lucide-react"

import { chessResultsUrl } from "@/lib/chess-results/url"
import { cn } from "@/lib/utils"

/** Pill-sized "Ver en chess-results" external link; renders nothing when not linked. */
export function ChessResultsLink({ tnr, className }: { tnr?: number | null; className?: string }) {
  if (!tnr) return null
  return (
    <a
      href={chessResultsUrl(tnr)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-terracotta transition-colors hover:border-amber hover:bg-accent",
        className,
      )}
    >
      Ver en chess-results
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}
