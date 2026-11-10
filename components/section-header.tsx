import Link from "next/link"
import { ChevronRight } from "lucide-react"

// Section title with a "see more" link to the full listing
export function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <h2 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{title}</h2>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 pb-1 text-base font-bold tracking-tight text-terracotta underline-offset-4 hover:underline md:text-lg"
      >
        Ver más
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}
