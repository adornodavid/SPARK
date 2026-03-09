import { Skeleton } from "@/components/ui/skeleton"

export default function CotizacionesLoading() {
  return (
    <div className="space-y-6">
      {/* Header with title and button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="flex gap-4 border-b p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
