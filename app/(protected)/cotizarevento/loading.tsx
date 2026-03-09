import { Skeleton } from "@/components/ui/skeleton"

export default function CotizarEventoLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1 rounded-full" />
        ))}
      </div>

      {/* Form skeleton */}
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
