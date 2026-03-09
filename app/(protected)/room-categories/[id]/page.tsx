import { Suspense } from "react"
import { notFound } from "next/navigation"
import { RoomCategoryForm } from "@/components/admin/room-categories/room-category-form"
import {
  obtenerCategoriaHabitacion,
  ddlHotelesHabitaciones,
} from "@/app/actions/habitaciones"

function LoadingState() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="h-[500px] animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function EditCategoryContent({ id }: { id: string }) {
  const [categoryResult, hotelsResult] = await Promise.all([
    obtenerCategoriaHabitacion(id),
    ddlHotelesHabitaciones(),
  ])

  if (!categoryResult.success || !categoryResult.data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl">
      <RoomCategoryForm
        category={categoryResult.data}
        hotels={hotelsResult.data || []}
      />
    </div>
  )
}

export default async function EditRoomCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense fallback={<LoadingState />}>
      <EditCategoryContent id={id} />
    </Suspense>
  )
}
