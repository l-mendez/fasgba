import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminContentSkeletonProps {
  stats?: number
  rows?: number
  filters?: boolean
}

export function AdminContentSkeleton({
  stats = 0,
  rows = 6,
  filters = true,
}: AdminContentSkeletonProps) {
  return (
    <div className="space-y-6" aria-label="Cargando contenido">
      {stats > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: stats }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {filters ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
      ) : null}

      <div className="rounded-md border">
        <div className="space-y-3 p-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
