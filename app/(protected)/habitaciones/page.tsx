import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus, BedDouble, CheckCircle, Wrench, XCircle } from "lucide-react"
import Link from "next/link"
import { RoomsTable } from "@/components/admin/rooms/rooms-table"
import {
  obtenerHabitaciones,
  ddlHotelesHabitaciones,
  ddlCategoriasHabitacion,
  obtenerEstadisticasHabitaciones,
} from "@/app/actions/habitaciones"

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

async function HabitacionesContent() {
  const [roomsResult, hotelsResult, categoriesResult, statsResult] = await Promise.all([
    obtenerHabitaciones(),
    ddlHotelesHabitaciones(),
    ddlCategoriasHabitacion(),
    obtenerEstadisticasHabitaciones(),
  ])

  const rooms = roomsResult.data || []
  const hotels = hotelsResult.data || []
  const categories = categoriesResult.data || []
  const stats = statsResult.data

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Habitaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las habitaciones de los hoteles MGHM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/room-categories">
              Categorias
            </Link>
          </Button>
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/habitaciones/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Habitacion
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="spark-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total habitaciones</p>
            </div>
          </div>
        </div>
        <div className="spark-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.disponibles}</p>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </div>
          </div>
        </div>
        <div className="spark-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ocupadas}</p>
              <p className="text-xs text-muted-foreground">Ocupadas</p>
            </div>
          </div>
        </div>
        <div className="spark-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.mantenimiento}</p>
              <p className="text-xs text-muted-foreground">Mantenimiento</p>
            </div>
          </div>
        </div>
        <div className="spark-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.categorias}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <RoomsTable rooms={rooms} hotels={hotels} categories={categories} />
    </div>
  )
}

export default function HabitacionesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HabitacionesContent />
    </Suspense>
  )
}
