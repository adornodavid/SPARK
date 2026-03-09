import { Suspense } from "react"
import { RoomCategoryForm } from "@/components/admin/room-categories/room-category-form"
import { ddlHotelesHabitaciones } from "@/app/actions/habitaciones"

function LoadingState() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="h-[500px] animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function NewCategoryContent() {
  const hotelsResult = await ddlHotelesHabitaciones()

  return (
    <div className="mx-auto max-w-3xl">
      <RoomCategoryForm
        hotels={hotelsResult.data || []}
      />
    </div>
  )
}

export default function NewRoomCategoryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewCategoryContent />
    </Suspense>
  )
}
