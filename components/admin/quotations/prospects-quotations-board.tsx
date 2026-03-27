"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar, Users, GripVertical, Search, PartyPopper, Pencil, X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones } from "@/app/actions/salones"
import { listaEstatusCotizacion, listaEstatusSeguimiento, listaEstatusReservacion } from "@/app/actions/catalogos"
import type { ddlItem } from "@/types/common"

/* ==================================================
  Types
================================================== */
interface BoardItem {
  id: number; folio: string; cliente: string; nombreevento: string; tipoevento: string
  numeroinvitados: number; fechainicio: string; fechafin: string
  hotelid?: number; salonid?: number; estatus?: string
  hotel?: string; salon?: string; montaje?: string; categoriaevento?: string
  tiporegistro?: string; horainicio?: string; horafin?: string
}

interface ColumnDef {
  id: string; title: string; color: string
  type: "prospecto" | "cotizacion" | "estatus" | "seguimiento" | "reservacion"
  estatusFilter?: string
}

/* ==================================================
  Color palette for estatus pills (cycle through these)
================================================== */
const ESTATUS_COLORS = [
  { color: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-300" },
  { color: "bg-amber-400", bg: "bg-amber-50", border: "border-amber-300" },
  { color: "bg-green-500", bg: "bg-green-50", border: "border-green-300" },
  { color: "bg-red-500", bg: "bg-red-50", border: "border-red-300" },
  { color: "bg-cyan-500", bg: "bg-cyan-50", border: "border-cyan-300" },
  { color: "bg-purple-500", bg: "bg-purple-50", border: "border-purple-300" },
  { color: "bg-orange-400", bg: "bg-orange-50", border: "border-orange-300" },
  { color: "bg-slate-500", bg: "bg-slate-50", border: "border-slate-300" },
  { color: "bg-pink-500", bg: "bg-pink-50", border: "border-pink-300" },
  { color: "bg-teal-500", bg: "bg-teal-50", border: "border-teal-300" },
]

function getEstatusColor(idx: number) {
  return ESTATUS_COLORS[idx % ESTATUS_COLORS.length]
}

const CORE_COLUMNS: ColumnDef[] = [
  { id: "prospectos", title: "Prospectos", color: "bg-blue-500", type: "prospecto" },
  { id: "cotizaciones", title: "Cotizaciones", color: "bg-emerald-500", type: "cotizacion" },
]

/* ==================================================
  Board Component
================================================== */
export function ProspectsQuotationsBoard() {
  const supabase = createBrowserClient()
  const [prospectos, setProspectos] = useState<BoardItem[]>([])
  const [cotizaciones, setCotizaciones] = useState<BoardItem[]>([])
  const [seguimiento, setSeguimiento] = useState<BoardItem[]>([])
  const [reservaciones, setReservaciones] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)

  // Estatus from DB
  const [estatusList, setEstatusList] = useState<ddlItem[]>([])
  const [seguimientoEstatusList, setSeguimientoEstatusList] = useState<ddlItem[]>([])
  const [reservacionEstatusList, setReservacionEstatusList] = useState<ddlItem[]>([])
  const [seguimientoEstatusIds, setSeguimientoEstatusIds] = useState<Set<number>>(new Set())

  // All column IDs in order
  const [columnOrder, setColumnOrder] = useState<string[]>(["prospectos", "cotizaciones"])

  // Filters
  const [filters, setFilters] = useState({ search: "", hotel_id: "", salon_id: "", estatus: "" })
  const [hotels, setHotels] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])

  // Column drag
  const [draggedColId, setDraggedColId] = useState<string | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)

  // Estatus pill drag
  const [draggedEstatus, setDraggedEstatus] = useState<string | null>(null)
  const [dropZoneActive, setDropZoneActive] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Filtro de estatus por columna
  const [colEstatusFilter, setColEstatusFilter] = useState<Record<string, string>>({})

  useEffect(() => { listaDesplegableHoteles().then((r) => { if (r.success && r.data) setHotels(r.data) }) }, [])
  useEffect(() => {
    const hId = filters.hotel_id && filters.hotel_id !== "all" ? Number(filters.hotel_id) : -1
    listaDesplegableSalones(-1, "", hId).then((r) => { if (r.success && r.data) setSalones(r.data) })
  }, [filters.hotel_id])
  useEffect(() => {
    listaEstatusCotizacion().then((r) => { if (r.success && r.data) setEstatusList(r.data) })
    listaEstatusSeguimiento().then((r) => {
      if (r.success && r.data) {
        setSeguimientoEstatusList(r.data)
        setSeguimientoEstatusIds(new Set(r.data.map((e: ddlItem) => Number(e.value))))
      }
    })
    listaEstatusReservacion().then((r) => {
      if (r.success && r.data) setReservacionEstatusList(r.data)
    })
  }, [])
  useEffect(() => { loadData() }, [])
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(filters.search), 400); return () => clearTimeout(t) }, [filters.search])

  async function loadData() {
    setLoading(true)
    const [pRes, eRes, segRes, resRes] = await Promise.all([
      supabase.from("vw_oprospectos").select("id, folio, cliente, nombreevento, tipoevento, numeroinvitados, fechainicio, fechafin, hotelid").order("id", { ascending: false }),
      supabase.from("vw_oeventos").select("*").order("id", { ascending: false }),
      listaEstatusSeguimiento(),
      listaEstatusReservacion(),
    ])
    setProspectos(pRes.data || [])
    // IDs de estatus por sección
    const segIds = new Set((segRes.success && segRes.data ? segRes.data : []).map((e: ddlItem) => Number(e.value)))
    const resIds = new Set((resRes.success && resRes.data ? resRes.data : []).map((e: ddlItem) => Number(e.value)))
    // Distinct por id — quedarse con la primera fila de cada evento
    const seen = new Set<number>()
    const uniqueEventos = (eRes.data || []).filter((row: any) => {
      if (seen.has(row.id)) return false
      seen.add(row.id)
      return true
    })
    // Separar por sección de estatus
    setCotizaciones(uniqueEventos.filter((e: any) => e.tiporegistro === "Cotizacion" && !segIds.has(e.estatusid) && !resIds.has(e.estatusid)))
    setSeguimiento(uniqueEventos.filter((e: any) => e.tiporegistro === "Cotizacion" && segIds.has(e.estatusid)))
    setReservaciones(uniqueEventos.filter((e: any) => resIds.has(e.estatusid)))

    const saved = localStorage.getItem("spark-board-column-order")
    if (saved) {
      try {
        const order: string[] = JSON.parse(saved)
        if (!order.includes("prospectos")) order.unshift("prospectos")
        if (!order.includes("cotizaciones")) order.splice(order.indexOf("prospectos") + 1, 0, "cotizaciones")
        setColumnOrder(order)
      } catch { /* default */ }
    }
    setLoading(false)
  }

  // Build column defs from order + estatusList
  const allColumnDefs = useMemo<ColumnDef[]>(() => {
    return columnOrder.map((id) => {
      const core = CORE_COLUMNS.find((c) => c.id === id)
      if (core) return core
      // Estatus column: id = "estatus-<nombre>"
      const estName = id.replace("estatus-", "")
      const estItem = estatusList.find((e) => e.text === estName)
      if (estItem) {
        const idx = estatusList.indexOf(estItem)
        const colors = getEstatusColor(idx)
        return { id, title: estItem.text, color: colors.color, type: "estatus" as const, estatusFilter: estItem.text }
      }
      return null
    }).filter(Boolean) as ColumnDef[]
  }, [columnOrder, estatusList])

  // Active estatus columns
  const activeEstatus = useMemo(() => columnOrder.filter((id) => id.startsWith("estatus-")).map((id) => id.replace("estatus-", "")), [columnOrder])

  function filterItems(items: BoardItem[]) {
    let f = items
    if (debouncedSearch) { const q = debouncedSearch.toLowerCase(); f = f.filter((i) => i.cliente?.toLowerCase().includes(q) || i.nombreevento?.toLowerCase().includes(q) || i.folio?.toLowerCase().includes(q) || i.tipoevento?.toLowerCase().includes(q)) }
    if (filters.hotel_id && filters.hotel_id !== "all") f = f.filter((i) => i.hotelid === Number(filters.hotel_id))
    if (filters.salon_id && filters.salon_id !== "all") f = f.filter((i) => i.salonid === Number(filters.salon_id))
    if (filters.estatus && filters.estatus !== "all") f = f.filter((i) => i.estatus === filters.estatus)
    return f
  }

  function getColumnItems(col: ColumnDef): BoardItem[] {
    let items: BoardItem[] = []
    if (col.type === "prospecto") items = filterItems(prospectos)
    else if (col.type === "cotizacion") items = filterItems(cotizaciones)
    else if (col.type === "seguimiento") items = filterItems(seguimiento)
    else if (col.type === "reservacion") items = filterItems(reservaciones)
    else if (col.type === "estatus" && col.estatusFilter) items = filterItems(cotizaciones.filter((c) => c.estatus === col.estatusFilter))
    // Aplicar filtro de estatus por columna
    const colFilter = colEstatusFilter[col.id]
    if (colFilter && colFilter !== "all") items = items.filter((i) => i.estatus === colFilter)
    return items
  }

  function getEstatusListForColumn(colId: string): ddlItem[] {
    if (colId === "prospectos") return []
    if (colId === "cotizaciones") return estatusList
    if (colId === "seguimiento") return seguimientoEstatusList
    if (colId === "reservaciones") return reservacionEstatusList
    return []
  }

  function saveOrder(order: string[]) { setColumnOrder(order); localStorage.setItem("spark-board-column-order", JSON.stringify(order)) }

  // Column drag
  function onColDragStart(e: React.DragEvent, id: string) { setDraggedColId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/column", id); if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "0.5" }
  function onColDragEnd(e: React.DragEvent) { if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "1"; setDraggedColId(null); setDragOverColId(null) }
  function onColDragOver(e: React.DragEvent, id: string) { e.preventDefault(); if (draggedColId && draggedColId !== id) setDragOverColId(id) }
  function onColDragLeave() { setDragOverColId(null) }
  function onColDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault(); setDragOverColId(null)
    if (!draggedColId || draggedColId === targetId) { setDraggedColId(null); return }
    const order = [...columnOrder]; const fi = order.indexOf(draggedColId), ti = order.indexOf(targetId)
    if (fi === -1 || ti === -1) { setDraggedColId(null); return }
    order.splice(fi, 1); order.splice(ti, 0, draggedColId); saveOrder(order); setDraggedColId(null)
  }

  // Estatus pill drag
  function onEstDragStart(e: React.DragEvent, estName: string) { setDraggedEstatus(estName); e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/estatus", estName) }
  function onEstDragEnd() { setDraggedEstatus(null); setDropZoneActive(false) }
  function onZoneDragOver(e: React.DragEvent) { e.preventDefault(); if (draggedEstatus) { e.dataTransfer.dropEffect = "copy"; setDropZoneActive(true) } }
  function onZoneDragLeave() { setDropZoneActive(false) }
  function onZoneDrop(e: React.DragEvent) {
    e.preventDefault(); setDropZoneActive(false)
    const estName = e.dataTransfer.getData("text/estatus")
    const colId = `estatus-${estName}`
    if (estName && !columnOrder.includes(colId)) saveOrder([...columnOrder, colId])
    setDraggedEstatus(null)
  }

  function removeColumn(id: string) { saveOrder(columnOrder.filter((c) => c !== id)) }

  function formatDate(ds: string) {
    if (!ds) return "—"
    return new Date(ds + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  // Get estatus color for a given name
  function getColorForEstatus(name: string) {
    const idx = estatusList.findIndex((e) => e.text === name)
    return idx >= 0 ? getEstatusColor(idx) : ESTATUS_COLORS[0]
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-1 space-y-1">
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-[250px] space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Folio, cliente, evento..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} className="pl-8 h-8 text-xs" />
              </div>
            </div>
            <div className="w-[270px] space-y-1">
              <Label className="text-xs">Hotel</Label>
              <Select value={filters.hotel_id} onValueChange={(v) => setFilters((p) => ({ ...p, hotel_id: v, salon_id: "" }))}>
                <SelectTrigger className="w-full h-8 text-xs truncate"><SelectValue placeholder="Todos los hoteles" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los hoteles</SelectItem>{hotels.map((h) => <SelectItem key={h.value} value={h.value}>{h.text}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-[180px] space-y-1">
              <Label className="text-xs">Salon</Label>
              <Select value={filters.salon_id} onValueChange={(v) => setFilters((p) => ({ ...p, salon_id: v }))}>
                <SelectTrigger className="w-full h-8 text-xs truncate"><SelectValue placeholder="Todos los salones" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los salones</SelectItem>{salones.map((s) => <SelectItem key={s.value} value={s.value}>{s.text}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-[170px] space-y-1">
              <Label className="text-xs">Estatus</Label>
              <Select value={filters.estatus} onValueChange={(v) => setFilters((p) => ({ ...p, estatus: v }))}>
                <SelectTrigger className="w-full h-8 text-xs truncate"><SelectValue placeholder="Todos los estatus" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estatus</SelectItem>
                  {estatusList.map((e) => <SelectItem key={e.value} value={e.text}>{e.text}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estatus pills — draggable */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Arrastra un estatus al tablero para crear una columna</Label>
            <div className="flex flex-wrap gap-1.5">
              {estatusList.map((est, idx) => {
                const colors = getEstatusColor(idx)
                const isActive = activeEstatus.includes(est.text)
                return (
                  <div key={est.value} draggable={!isActive}
                    onDragStart={(e) => !isActive && onEstDragStart(e, est.text)} onDragEnd={onEstDragEnd}
                    onDoubleClick={() => { if (!isActive) { const colId = `estatus-${est.text}`; saveOrder([...columnOrder, colId]) } }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all select-none ${
                      isActive ? `${colors.bg} ${colors.border} opacity-50 cursor-default` : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing"
                    } ${draggedEstatus === est.text ? "opacity-40 scale-95" : ""}`}>
                    <div className={`w-2 h-2 rounded-full ${colors.color}`} />
                    {est.text}
                    {isActive && <span className="text-[8px] opacity-60 ml-0.5">(activo)</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board — drop zone */}
      <div onDragOver={onZoneDragOver} onDragLeave={onZoneDragLeave} onDrop={onZoneDrop}
        className={`transition-all rounded-xl min-h-[200px] ${dropZoneActive ? "ring-2 ring-dashed ring-blue-400 bg-blue-50/50 p-2" : ""}`}>
        {dropZoneActive && <div className="text-center py-4 text-sm text-blue-500 font-medium animate-pulse">Suelta aquí para crear columna</div>}

        <div className="grid grid-cols-4 gap-3 pb-4">
          {allColumnDefs.map((col) => {
            const items = getColumnItems(col)
            const isOver = dragOverColId === col.id
            const isEstatus = col.type === "estatus"
            const colors = isEstatus && col.estatusFilter ? getColorForEstatus(col.estatusFilter) : null

            return (
              <div key={col.id} draggable
                onDragStart={(e) => onColDragStart(e, col.id)} onDragEnd={onColDragEnd}
                onDragOver={(e) => onColDragOver(e, col.id)} onDragLeave={onColDragLeave}
                onDrop={(e) => onColDrop(e, col.id)}
                className={`min-w-0 rounded-xl border transition-all ${
                  isOver ? "border-primary bg-primary/5 shadow-lg scale-[1.01]"
                  : isEstatus && colors ? `${colors.border} ${colors.bg}`
                  : "border-border/50 bg-muted/30"
                }`}>
                <div className={`p-2 border-b cursor-grab active:cursor-grabbing ${isEstatus && colors ? colors.border : "border-border/50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${col.color}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate">{col.title}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(() => {
                        const colEstList = getEstatusListForColumn(col.id)
                        if (colEstList.length === 0) return null
                        return (
                          <Select value={colEstatusFilter[col.id] || "all"} onValueChange={(v) => setColEstatusFilter((p) => ({ ...p, [col.id]: v }))}>
                            <SelectTrigger className="h-5 w-[90px] text-[9px] px-1.5 gap-0.5"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {colEstList.map((e) => <SelectItem key={e.value} value={e.text}>{e.text}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )
                      })()}
                      <Badge variant="secondary" className="text-[10px] font-semibold px-1.5">{items.length}</Badge>
                      {isEstatus && (
                        <button type="button" onClick={() => removeColumn(col.id)}
                          className="p-0.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Cerrar columna">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-440px)] overflow-y-auto">
                  {items.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Sin {col.title.toLowerCase()}</div>}
                  {items.map((item) => <BoardCard key={`${col.id}-${item.id}`} item={item} type={col.type} formatDate={formatDate} estatusList={[...estatusList, ...seguimientoEstatusList, ...reservacionEstatusList]} />)}
                </div>
              </div>
            )
          })}

          {/* Columna fija: Seguimiento y objeciones */}
          {(() => {
            const segItems = getColumnItems({ id: "seguimiento", title: "Seguimiento y objeciones", color: "bg-orange-500", type: "seguimiento" })
            return (
              <div className="min-w-0 rounded-xl border border-orange-300 bg-orange-50/50 transition-all">
                <div className="p-2 border-b border-orange-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate">Seguimiento</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Select value={colEstatusFilter["seguimiento"] || "all"} onValueChange={(v) => setColEstatusFilter((p) => ({ ...p, seguimiento: v }))}>
                        <SelectTrigger className="h-5 w-[90px] text-[9px] px-1.5 gap-0.5"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {seguimientoEstatusList.map((e) => <SelectItem key={e.value} value={e.text}>{e.text}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 flex-shrink-0">{segItems.length}</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-440px)] overflow-y-auto">
                  {segItems.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Sin seguimiento</div>}
                  {segItems.map((item) => <BoardCard key={`seg-${item.id}`} item={item} type="seguimiento" formatDate={formatDate} estatusList={[...estatusList, ...seguimientoEstatusList, ...reservacionEstatusList]} />)}
                </div>
              </div>
            )
          })()}

          {/* Columna fija: Reservaciones */}
          {(() => {
            const resItems = getColumnItems({ id: "reservaciones", title: "Reservaciones", color: "bg-violet-500", type: "reservacion" })
            return (
              <div className="min-w-0 rounded-xl border border-violet-300 bg-violet-50/50 transition-all">
                <div className="p-2 border-b border-violet-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-violet-500 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate">Reservaciones</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Select value={colEstatusFilter["reservaciones"] || "all"} onValueChange={(v) => setColEstatusFilter((p) => ({ ...p, reservaciones: v }))}>
                        <SelectTrigger className="h-5 w-[90px] text-[9px] px-1.5 gap-0.5"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {reservacionEstatusList.map((e) => <SelectItem key={e.value} value={e.text}>{e.text}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 flex-shrink-0">{resItems.length}</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-440px)] overflow-y-auto">
                  {resItems.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Sin reservaciones</div>}
                  {resItems.map((item) => <BoardCard key={`res-${item.id}`} item={item} type="reservacion" formatDate={formatDate} estatusList={[...estatusList, ...seguimientoEstatusList, ...reservacionEstatusList]} />)}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

/* ==================================================
  Card Component
================================================== */
function BoardCard({ item, type, formatDate, estatusList }: { item: BoardItem; type: "prospecto" | "cotizacion" | "estatus" | "seguimiento" | "reservacion"; formatDate: (d: string) => string; estatusList: ddlItem[] }) {
  const router = useRouter()
  const href = type === "prospecto" ? `/cotizaciones/new` : `/cotizaciones/${item.id}`
  const editHref = `/cotizaciones/new?editId=${item.id}`

  const estIdx = item.estatus ? estatusList.findIndex((e) => e.text === item.estatus) : -1
  const estColors = estIdx >= 0 ? getEstatusColor(estIdx) : null

  return (
    <Link href={href}>
      <div className="rounded-lg border border-border/60 bg-card px-2.5 py-1.5 hover:shadow-md hover:border-border transition-all cursor-pointer">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold truncate flex-1">{item.nombreevento || "Sin nombre de evento"}</p>
          {item.estatus && estColors && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${estColors.bg} ${estColors.border} flex-shrink-0`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${estColors.color} mr-0.5`} />
              {item.estatus}
            </span>
          )}
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(editHref) }} className="p-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0" title="Editar">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{item.cliente || "—"}</span>
          <span className="text-border">|</span>
          <PartyPopper className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{item.tipoevento || "—"}</span>
          <span className="text-border">|</span>
          <Users className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{item.numeroinvitados ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{formatDate(item.fechainicio)}</span>
          <span className="text-muted-foreground/50">→</span>
          <span>{formatDate(item.fechafin)}</span>
        </div>
      </div>
    </Link>
  )
}
