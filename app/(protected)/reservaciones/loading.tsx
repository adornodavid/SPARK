export default function ReservacionesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse mt-2" />
        </div>
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-9 flex-1 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg bg-card">
        <div className="border-b px-4 py-3 flex gap-4">
          {[60, 80, 120, 100, 80, 60, 80, 70].map((w, i) => (
            <div key={i} className="h-4 rounded bg-muted animate-pulse" style={{ width: `${w}px` }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-4 flex items-center gap-4">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
            </div>
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-14 rounded bg-muted animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
