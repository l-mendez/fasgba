import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  action?: {
    href: string
    label: string
  }
}

export function HomeSectionHeader({ icon: Icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 dark:bg-amber/10">
            <Icon className="h-5 w-5 text-amber" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
        </div>
        <p className="text-muted-foreground ml-[52px]">{subtitle}</p>
      </div>
      {action && (
        <Button asChild variant="ghost" className="text-amber-dark hover:text-amber hover:bg-amber/10 self-start sm:self-auto">
          <Link href={action.href} className="flex items-center gap-2">
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
