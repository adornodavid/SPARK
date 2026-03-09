"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Search, BedDouble, LayoutGrid, List, DoorOpen } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { eliminarHabitacion } from "@/app/actions/habitaciones"
import { ESTADOS_HABITACION } from "@/types/habitaciones"
import type { oHabitacionDetalle, EstadoHabitacion, ddlHotel, ddlCategoria } from "@/types/habitaciones"

function StatusBadge({ status }: { status: string }) {
  const estado = ESTADOS_HABITACION.find((e) => e.value === status)
  if (!estado) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
        {status || "Sin estado"}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.color}`}>
      {estado.label}
    </span>
  )
}

interface RoomsTableProps {
  rooms: oHabitacionDetalle[]
  hotels: ddlHotel[]
  categories: ddlCategoria[]
}

export function RoomsTable({ rooms, hotels, categories }: RoomsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterHotel, setFilterHotel] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Filter categories by selected hotel
  const filteredCategories = useMemo(() => {
    if (filterHotel === "all") return categories
    return categories.filter((c) => c.hotel_id === filterHotel)
  }, [categories, filterHotel])

  // Client-side filtering for instant response
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filterHotel !== "all" && room.hotel_id !== filterHotel) return false
      if (filterCategory !== "all" && room.category_id !== filterCategory) return false
      if (filterStatus !== "all" && room.status !== filterStatus) return false
      if (search.trim() !== "") {
        const s = search.toLowerCase()
        const matchNumber = room.room_number?.toLowerCase().includes(s)
        const matchHotel = room.hotel?.name?.toLowerCase().includes(s)
        const matchCategory = room.room_categories?.name?.toLowerCase().includes(s)
        const matchNotes = room.notes?.toLowerCase().includes(s)
        if (!matchNumber && !matchHotel && !matchCategory && !matchNotes) return false
      }
      return true
    })
  }, [rooms, filterHotel, filterCategory, filterStatus, search])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const result = await eliminarHabitacion(deleteId)

    if (!result.success) {
      toast.error(result.error || "Error al eliminar la habitacion")
    } else {
      toast.success("Habitacion eliminada correctamente")
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const clearFilters = () => {
    setSearch("")
    setFilterHotel("all")
    setFilterCategory("all")
    setFilterStatus("all")
  }

  const hasActiveFilters = search !== "" || filterHotel !== "all" || filterCategory !== "all" || filterStatus !== "all"

  return (
    <>
      {/* Filters Bar */}
      <div className="spark-card p-4 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por numero, hotel, categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterHotel} onValueChange={(v) => { setFilterHotel(v); setFilterCategory("all") }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos los hoteles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hoteles</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS_HABITACION.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredRooms.length} habitacion{filteredRooms.length !== 1 ? "es" : ""}
              {hasActiveFilters ? " (filtradas)" : ""}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Hotel</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead className="text-right">Precio Rack</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <BedDouble className="h-8 w-8 opacity-50" />
                      <p className="text-sm">No hay habitaciones {hasActiveFilters ? "que coincidan con los filtros" : "registradas"}</p>
                      {!hasActiveFilters && (
                        <Button asChild variant="outline" size="sm" className="mt-2">
                          <Link href="/habitaciones/new">Crear primera habitacion</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room) => (
                  <TableRow key={room.id} className="group">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{room.hotel?.name || "Sin hotel"}</div>
                        <div className="text-xs text-muted-foreground">{room.hotel?.code || ""}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold text-sm">{room.room_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{room.room_categories?.name || "Sin categoria"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {room.floor !== null ? `Piso ${room.floor}` : "--"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {room.capacity ? `${room.capacity} pers.` : "--"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">
                        {room.rack_price
                          ? `$${Number(room.rack_price).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
                          : "--"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={room.status || (room.is_available ? "disponible" : "fuera_de_servicio")} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Link href={`/habitaciones/${room.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <BedDouble className="h-8 w-8 opacity-50" />
              <p className="text-sm">No hay habitaciones {hasActiveFilters ? "que coincidan con los filtros" : "registradas"}</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div key={room.id} className="spark-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <DoorOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-lg leading-none">{room.room_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{room.hotel?.code || ""}</p>
                    </div>
                  </div>
                  <StatusBadge status={room.status || (room.is_available ? "disponible" : "fuera_de_servicio")} />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{room.hotel?.name || "Sin hotel"}</p>
                  <p className="text-xs text-muted-foreground">{room.room_categories?.name || "Sin categoria"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {room.floor !== null && <span>Piso {room.floor}</span>}
                    {room.capacity && <span>{room.capacity} pers.</span>}
                    {room.rack_price && (
                      <span className="font-medium text-foreground">
                        ${Number(room.rack_price).toLocaleString("es-MX")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-xs">
                    <Link href={`/habitaciones/${room.id}`}>
                      <Edit className="mr-1.5 h-3 w-3" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(room.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar habitacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente la habitacion del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
