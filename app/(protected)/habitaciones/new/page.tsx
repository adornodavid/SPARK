import { Suspense } from "react"
import { RoomForm } from "@/components/admin/rooms/room-form"
import {
  ddlHotelesHabitaciones,
  ddlCategoriasHabitacion,
} from "@/app/actions/habitaciones"

function LoadingState() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="h-[600px] animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function NewRoomContent() {
  const [hotelsResult, categoriesResult] = await Promise.all([
    ddlHotelesHabitaciones(),
    ddlCategoriasHabitacion(),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <RoomForm
        hotels={hotelsResult.data || []}
        categories={categoriesResult.data || []}
      />
    </div>
  )
}

export default function NewHabitacionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewRoomContent />
    </Suspense>
  )
}
