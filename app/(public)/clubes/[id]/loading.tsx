import { Skeleton } from "@/components/ui/skeleton"

// Mirrors the club header (back link, logo, name, info rows) while data loads.
export default function Loading() {
  return (
    <section className="w-full pt-8 md:pt-12" aria-busy="true" aria-label="Cargando club">
      <div className="container space-y-4 px-4 md:px-6">
        <Skeleton className="h-5 w-20" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-28 w-28 shrink-0 rounded-lg md:h-36 md:w-36" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-2/3 max-w-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
