import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RoomCategoriesTable } from "@/components/admin/room-categories/room-categories-table"
import {
  obtenerCategoriasHabitacion,
  ddlHotelesHabitaciones,
} from "@/app/actions/habitaciones"

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function CategoriesContent() {
  const [categoriesResult, hotelsResult] = await Promise.all([
    obtenerCategoriasHabitacion(),
    ddlHotelesHabitaciones(),
  ])

  const categories = categoriesResult.data || []
  const hotels = hotelsResult.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias de Habitaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorias y tipos de habitaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/habitaciones">
              Habitaciones
            </Link>
          </Button>
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/room-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoria
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <RoomCategoriesTable categories={categories} hotels={hotels} />
    </div>
  )
}

export default function RoomCategoriesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CategoriesContent />
    </Suspense>
  )
}
