import { Skeleton } from "@/components/ui/skeleton"

export default function ClientesLoading() {
  return (
    <div className="space-y-6">
      {/* Header with title and button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="flex gap-4 border-b p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
