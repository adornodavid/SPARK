"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  Users,
  GripVertical,
  Search,
  X,
  PartyPopper,
  Pencil,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones } from "@/app/actions/salones"
import type { ddlItem } from "@/types/common"

/* ==================================================
  Types
================================================== */
interface BoardItem {
  id: number
  folio: string
  cliente: string
  nombreevento: string
  tipoevento: string
  numeroinvitados: number
  fechainicio: string
  fechafin: string
  hotelid?: number
  salonid?: number
  estatus?: string
}

interface Column {
  id: string
  title: string
  color: string
  items: BoardItem[]
  type: "prospecto" | "cotizacion"
}

/* ==================================================
  Board Component
================================================== */
export function ProspectsQuotationsBoard() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    hotel_id: "",
    salon_id: "",
    status: "",
  })
  const [hotels, setHotels] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])

  // Drag state for columns
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

  // Load hotels on mount
  useEffect(() => {
    async function loadHotels() {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) setHotels(result.data)
    }
    loadHotels()
  }, [])

  // Load salones when hotel changes
  useEffect(() => {
    async function loadSalones() {
      const hotelId = filters.hotel_id && filters.hotel_id !== "all" ? Number(filters.hotel_id) : -1
      const result = await listaDesplegableSalones(-1, "", hotelId)
      if (result.success && result.data) setSalones(result.data)
    }
    loadSalones()
  }, [filters.hotel_id])

  useEffect(() => {
    loadData()
  }, [])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  async function loadData() {
    setLoading(true)

    const [prospectosRes, cotizacionesRes] = await Promise.all([
      supabase
        .from("vw_oprospectos")
        .select("id, folio, cliente, nombreevento, tipoevento, numeroinvitados, fechainicio, fechafin, hotelid")
        .order("id", { ascending: false }),
      supabase
        .from("vw_ocotizaciones")
        .select("id, folio, cliente, nombreevento, tipoevento, numeroinvitados, fechainicio, fechafin, hotelid, salonid, estatus")
        .order("id", { ascending: false }),
    ])

    const prospectos: BoardItem[] = prospectosRes.data || []
    const cotizaciones: BoardItem[] = cotizacionesRes.data || []

    // Read saved column order from localStorage
    const savedOrder = localStorage.getItem("spark-board-column-order")
    const defaultColumns: Column[] = [
      {
        id: "prospectos",
        title: "Prospectos",
        color: "bg-blue-500",
        items: prospectos,
        type: "prospecto",
      },
      {
        id: "cotizaciones",
        title: "Cotizaciones",
        color: "bg-emerald-500",
        items: cotizaciones,
        type: "cotizacion",
      },
    ]

    if (savedOrder) {
      try {
        const order: string[] = JSON.parse(savedOrder)
        const ordered = order
          .map((id) => defaultColumns.find((c) => c.id === id))
          .filter(Boolean) as Column[]
        defaultColumns.forEach((c) => {
          if (!ordered.find((o) => o.id === c.id)) ordered.push(c)
        })
        setColumns(ordered)
      } catch {
        setColumns(defaultColumns)
      }
    } else {
      setColumns(defaultColumns)
    }

    setLoading(false)
  }

  // Filter items by all filters
  function getFilteredItems(items: BoardItem[]) {
    let filtered = items

    // Text search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.cliente?.toLowerCase().includes(q) ||
          item.nombreevento?.toLowerCase().includes(q) ||
          item.folio?.toLowerCase().includes(q) ||
          item.tipoevento?.toLowerCase().includes(q)
      )
    }

    // Hotel filter
    if (filters.hotel_id && filters.hotel_id !== "all") {
      filtered = filtered.filter((item) => item.hotelid === Number(filters.hotel_id))
    }

    // Salon filter (only applies to cotizaciones that have salonid)
    if (filters.salon_id && filters.salon_id !== "all") {
      filtered = filtered.filter((item) => item.salonid === Number(filters.salon_id))
    }

    // Status filter (only applies to cotizaciones that have estatus)
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((item) => item.estatus === filters.status)
    }

    return filtered
  }

  // Column drag handlers
  function handleColumnDragStart(e: React.DragEvent, columnId: string) {
    setDraggedColumnId(columnId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", columnId)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  function handleColumnDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedColumnId(null)
    setDragOverColumnId(null)
  }

  function handleColumnDragOver(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedColumnId && draggedColumnId !== columnId) {
      setDragOverColumnId(columnId)
    }
  }

  function handleColumnDragLeave() {
    setDragOverColumnId(null)
  }

  function handleColumnDrop(e: React.DragEvent, targetColumnId: string) {
    e.preventDefault()
    setDragOverColumnId(null)

    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null)
      return
    }

    setColumns((prev) => {
      const newCols = [...prev]
      const fromIdx = newCols.findIndex((c) => c.id === draggedColumnId)
      const toIdx = newCols.findIndex((c) => c.id === targetColumnId)
      if (fromIdx === -1 || toIdx === -1) return prev

      const [moved] = newCols.splice(fromIdx, 1)
      newCols.splice(toIdx, 0, moved)

      localStorage.setItem(
        "spark-board-column-order",
        JSON.stringify(newCols.map((c) => c.id))
      )

      return newCols
    })

    setDraggedColumnId(null)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "—"
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="w-[180px] space-y-2">
              <Label>Buscar por Folio</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-[220px] space-y-2">
              <Label>Hotel</Label>
              <Select
                value={filters.hotel_id}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, hotel_id: value, salon_id: "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los hoteles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los hoteles</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[220px] space-y-2">
              <Label>Salon</Label>
              <Select
                value={filters.salon_id}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, salon_id: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los salones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los salones</SelectItem>
                  {salones.map((salon) => (
                    <SelectItem key={salon.value} value={salon.value}>
                      {salon.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px] space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="Rechazada">Rechazada</SelectItem>
                  <SelectItem value="Expirada">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
        {columns.map((column) => {
          const filtered = getFilteredItems(column.items)
          const isOver = dragOverColumnId === column.id

          return (
            <div
              key={column.id}
              draggable
              onDragStart={(e) => handleColumnDragStart(e, column.id)}
              onDragEnd={handleColumnDragEnd}
              onDragOver={(e) => handleColumnDragOver(e, column.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, column.id)}
              className={`flex-shrink-0 w-[calc(25%-12px)] min-w-[260px] rounded-xl border transition-all ${
                isOver
                  ? "border-primary bg-primary/5 shadow-lg scale-[1.01]"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-border/50 cursor-grab active:cursor-grabbing">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <div className={`h-3 w-3 rounded-full ${column.color}`} />
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {column.title}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {filtered.length}
                  </Badge>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Sin {column.title.toLowerCase()}
                  </div>
                )}
                {filtered.map((item) => (
                  <BoardCard
                    key={`${column.type}-${item.id}`}
                    item={item}
                    type={column.type}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ==================================================
  Card Component
================================================== */
function BoardCard({
  item,
  type,
  formatDate,
}: {
  item: BoardItem
  type: "prospecto" | "cotizacion"
  formatDate: (d: string) => string
}) {
  const href =
    type === "cotizacion"
      ? `/cotizaciones/${item.id}`
      : `/cotizaciones/new`

  const editHref = `/cotizaciones/new?editId=${item.id}`

  return (
    <Link href={href}>
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 hover:shadow-md hover:border-border transition-all cursor-pointer">
        {/* Event name + Edit */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate flex-1">
            {item.nombreevento || "Sin nombre de evento"}
          </p>
          <Link
            href={editHref}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Client + Tipo evento + Invitados + Fechas */}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{item.cliente || "—"}</span>
          <span className="text-border">|</span>
          <PartyPopper className="h-3 w-3 flex-shrink-0" />
          <span>{item.tipoevento || "—"}</span>
          <span className="text-border">|</span>
          <Users className="h-3 w-3 flex-shrink-0" />
          <span>{item.numeroinvitados ?? "—"}</span>
        </div>

        {/* Fechas */}
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>{formatDate(item.fechainicio)}</span>
          <span className="text-muted-foreground/50">→</span>
          <span>{formatDate(item.fechafin)}</span>
        </div>
      </div>
    </Link>
  )
}
