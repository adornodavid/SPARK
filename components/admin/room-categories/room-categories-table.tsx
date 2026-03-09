"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Search, Users, Layers, BedDouble } from "lucide-react"
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
import { eliminarCategoriaHabitacion } from "@/app/actions/habitaciones"
import type { oCategoriaHabitacionDetalle, ddlHotel } from "@/types/habitaciones"

function parseAmenities(amenities: unknown): string[] {
  if (!amenities) return []
  if (Array.isArray(amenities)) return amenities as string[]
  if (typeof amenities === "string") {
    try {
      const parsed = JSON.parse(amenities)
      if (Array.isArray(parsed)) return parsed
      if (typeof parsed === "object" && parsed !== null) return Object.keys(parsed)
    } catch {
      return []
    }
  }
  if (typeof amenities === "object" && amenities !== null) {
    return Object.keys(amenities as Record<string, unknown>)
  }
  return []
}

interface RoomCategoriesTableProps {
  categories: oCategoriaHabitacionDetalle[]
  hotels: ddlHotel[]
}

export function RoomCategoriesTable({ categories, hotels }: RoomCategoriesTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterHotel, setFilterHotel] = useState("all")

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (filterHotel !== "all" && cat.hotel_id !== filterHotel) return false
      if (search.trim() !== "") {
        const s = search.toLowerCase()
        const matchName = cat.name?.toLowerCase().includes(s)
        const matchDesc = cat.description?.toLowerCase().includes(s)
        const matchHotel = cat.hotel?.name?.toLowerCase().includes(s)
        if (!matchName && !matchDesc && !matchHotel) return false
      }
      return true
    })
  }, [categories, filterHotel, search])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const result = await eliminarCategoriaHabitacion(deleteId)

    if (!result.success) {
      toast.error(result.error || "Error al eliminar la categoria")
    } else {
      toast.success("Categoria eliminada correctamente")
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteId(null)
    setDeleteName("")
  }

  const hasActiveFilters = search !== "" || filterHotel !== "all"

  return (
    <>
      {/* Filters */}
      <div className="spark-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripcion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterHotel} onValueChange={setFilterHotel}>
            <SelectTrigger className="w-[220px]">
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
        </div>
        <div className="flex items-center gap-2 mt-3">
          <p className="text-sm text-muted-foreground">
            {filteredCategories.length} categoria{filteredCategories.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtradas)" : ""}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setFilterHotel("all") }}
              className="h-7 text-xs"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Hotel</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead className="text-center">Ocupacion Max.</TableHead>
              <TableHead className="text-right">Precio Base</TableHead>
              <TableHead className="text-center">Habitaciones</TableHead>
              <TableHead>Amenidades</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Layers className="h-8 w-8 opacity-50" />
                    <p className="text-sm">
                      No hay categorias {hasActiveFilters ? "que coincidan con los filtros" : "registradas"}
                    </p>
                    {!hasActiveFilters && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href="/room-categories/new">Crear primera categoria</Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => {
                const amenityList = parseAmenities(category.amenities)
                return (
                  <TableRow key={category.id} className="group">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{category.hotel?.name || "Sin hotel"}</div>
                        <div className="text-xs text-muted-foreground">{category.hotel?.code || ""}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{category.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground max-w-xs truncate block">
                        {category.description || "--"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        <Users className="h-3 w-3" />
                        {category.max_occupancy || "--"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">
                        {category.base_price
                          ? `$${Number(category.base_price).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
                          : "--"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        <BedDouble className="h-3 w-3" />
                        {category._count?.rooms || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {amenityList.length > 0 ? (
                          <>
                            {amenityList.slice(0, 2).map((a) => (
                              <span key={a} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {a}
                              </span>
                            ))}
                            {amenityList.length > 2 && (
                              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{amenityList.length - 2} mas
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Link href={`/room-categories/${category.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteId(category.id)
                            setDeleteName(category.name)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteName("") }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria &quot;{deleteName}&quot;</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. No podras eliminar la categoria si tiene habitaciones asociadas.
              Las habitaciones que pertenezcan a esta categoria deberan reasignarse primero.
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
