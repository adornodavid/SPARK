import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters card skeleton */}
      <Skeleton className="h-36 w-full rounded-lg" />

      {/* Calendar + sidebar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-6" />
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={`day-${i}`} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming events */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`event-${i}`} className="h-20 rounded-lg" />
            ))}
          </div>

          {/* Statistics */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
