"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Building2, LayoutList, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { MenuCategoriesTable } from "@/components/admin/menus/menu-categories-table"
import { MenuItemsTable } from "@/components/admin/menus/menu-items-table"
import { obtenerMenus } from "@/app/actions/menus"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import type { oCategoriaConItems, oItemMenu } from "@/types/menus"
import type { ddlItem } from "@/types/common"
import { Badge } from "@/components/ui/badge"

export default function MenusPage() {
  const [categorias, setCategorias] = useState<oCategoriaConItems[]>([])
  const [allItems, setAllItems] = useState<oItemMenu[]>([])
  const [hoteles, setHoteles] = useState<ddlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [hotelFilter, setHotelFilter] = useState("")
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async (hotelId?: number, search?: string) => {
    setLoading(true)
    const result = await obtenerMenus(hotelId, search)
    if (result.success && result.data) {
      setCategorias(result.data)
      // Flatten all items for the items tab
      const items: oItemMenu[] = result.data.flatMap((cat) =>
        cat.items.map((item) => ({
          ...item,
          categorianombre: cat.nombre,
        }))
      )
      setAllItems(items)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const [_, hotelResult] = await Promise.all([
        loadData(),
        listaDesplegableHoteles(),
      ])
      if (hotelResult.success && hotelResult.data) {
        setHoteles(hotelResult.data)
      }
    }
    init()
  }, [loadData])

  function handleSearchChange(value: string) {
    setBusqueda(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      loadData(
        hotelFilter ? Number(hotelFilter) : undefined,
        value || undefined,
      )
    }, 400)
    setSearchTimeout(timeout)
  }

  function handleHotelChange(value: string) {
    const newValue = value === "todos" ? "" : value
    setHotelFilter(newValue)
    loadData(
      newValue ? Number(newValue) : undefined,
      busqueda || undefined,
    )
  }

  // Stats
  const totalCategorias = categorias.length
  const totalItems = allItems.length
  const totalDisponibles = allItems.filter((i) => i.disponible).length
  const totalConPrecio = allItems.filter((i) => i.precio > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menus y Platillos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las categorias y platillos para eventos de banquetes
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/menus/categories/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Categoria
            </Button>
          </Link>
          <Link href="/menus/items/new">
            <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
              <Plus className="h-4 w-4" />
              Platillo
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="spark-card p-4">
          <div className="text-2xl font-bold text-foreground">{totalCategorias}</div>
          <div className="text-xs text-muted-foreground">Categorias</div>
        </div>
        <div className="spark-card p-4">
          <div className="text-2xl font-bold text-foreground">{totalItems}</div>
          <div className="text-xs text-muted-foreground">Platillos totales</div>
        </div>
        <div className="spark-card p-4">
          <div className="text-2xl font-bold text-foreground">{totalDisponibles}</div>
          <div className="text-xs text-muted-foreground">Disponibles</div>
        </div>
        <div className="spark-card p-4">
          <div className="text-2xl font-bold text-foreground">{totalConPrecio}</div>
          <div className="text-xs text-muted-foreground">Con precio</div>
        </div>
      </div>

      {/* Filters */}
      <div className="spark-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar platillos por nombre o descripcion..."
              className="pl-9"
            />
          </div>
          <Select value={hotelFilter || "todos"} onValueChange={handleHotelChange}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Todos los hoteles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los hoteles</SelectItem>
              {hoteles.map((hotel) => (
                <SelectItem key={hotel.value} value={hotel.value}>
                  {hotel.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(busqueda || hotelFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusqueda("")
                setHotelFilter("")
                loadData()
              }}
              className="text-xs"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
        {busqueda && !loading && (
          <p className="text-xs text-muted-foreground mt-2">
            {allItems.length} resultado{allItems.length !== 1 ? "s" : ""} para &quot;{busqueda}&quot;
          </p>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias" className="gap-2">
            <Grid3X3 className="h-3.5 w-3.5" />
            Categorias
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {totalCategorias}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="platillos" className="gap-2">
            <LayoutList className="h-3.5 w-3.5" />
            Todos los Platillos
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {totalItems}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorias">
          <MenuCategoriesTable
            categorias={categorias}
            loading={loading}
            onUpdate={() =>
              loadData(
                hotelFilter ? Number(hotelFilter) : undefined,
                busqueda || undefined,
              )
            }
          />
        </TabsContent>

        <TabsContent value="platillos">
          <MenuItemsTable
            items={allItems}
            loading={loading}
            onUpdate={() =>
              loadData(
                hotelFilter ? Number(hotelFilter) : undefined,
                busqueda || undefined,
              )
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
