import { Suspense } from "react"
import { notFound } from "next/navigation"
import { RoomForm } from "@/components/admin/rooms/room-form"
import {
  obtenerHabitacion,
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

async function EditRoomContent({ id }: { id: string }) {
  const [roomResult, hotelsResult, categoriesResult] = await Promise.all([
    obtenerHabitacion(id),
    ddlHotelesHabitaciones(),
    ddlCategoriasHabitacion(),
  ])

  if (!roomResult.success || !roomResult.data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <RoomForm
        room={roomResult.data}
        hotels={hotelsResult.data || []}
        categories={categoriesResult.data || []}
      />
    </div>
  )
}

export default async function EditHabitacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense fallback={<LoadingState />}>
      <EditRoomContent id={id} />
    </Suspense>
  )
}
