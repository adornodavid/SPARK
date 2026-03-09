"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  User,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
  GripVertical,
  ChevronLeft,
  Users,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { obtenerPipeline, moverOportunidad } from "@/app/actions/crm"
import { ETAPAS_PIPELINE, type EtapaPipelineId, type oOportunidad, type oPipelineFiltros } from "@/types/crm"
import { toast } from "sonner"

// Definido localmente para no depender de cotizaciones.ts
const TIPOS_EVENTO = [
  "Boda", "Banquete", "Reunion", "Conferencia", "XV Años",
  "Graduacion", "Fiesta", "Convencion", "Coctel", "Otro",
]

interface PipelineBoardProps {
  session: any
}

export function PipelineBoard({ session }: PipelineBoardProps) {
  const router = useRouter()
  const [pipeline, setPipeline] = useState<Record<EtapaPipelineId, oOportunidad[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [showFilters, setShowFilters] = useState(false)
  const [draggedItem, setDraggedItem] = useState<oOportunidad | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<EtapaPipelineId | null>(null)

  // Filters
  const [filtros, setFiltros] = useState<oPipelineFiltros>({})
  const [busqueda, setBusqueda] = useState("")

  const vendedorId = session?.RolId && Number(session.RolId) >= 3
    ? Number(session.UsuarioId)
    : undefined

  useEffect(() => {
    loadPipeline()
  }, [filtros])

  async function loadPipeline() {
    setLoading(true)
    const result = await obtenerPipeline({
      ...filtros,
      vendedorId: vendedorId || filtros.vendedorId,
      busqueda,
    })
    if (result.success && result.data) {
      setPipeline(result.data)
    }
    setLoading(false)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros(prev => ({ ...prev, busqueda }))
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  // Drag & Drop handlers using native HTML Drag API
  function handleDragStart(e: React.DragEvent, item: oOportunidad) {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", item.id.toString())
    // Make the drag ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: React.DragEvent, columnId: EtapaPipelineId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  async function handleDrop(e: React.DragEvent, nuevaEtapa: EtapaPipelineId) {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.etapa === nuevaEtapa) {
      setDraggedItem(null)
      return
    }

    // Optimistic update
    if (pipeline) {
      const updatedPipeline = { ...pipeline }
      updatedPipeline[draggedItem.etapa] = updatedPipeline[draggedItem.etapa].filter(
        o => o.id !== draggedItem.id
      )
      updatedPipeline[nuevaEtapa] = [
        { ...draggedItem, etapa: nuevaEtapa },
        ...updatedPipeline[nuevaEtapa],
      ]
      setPipeline(updatedPipeline)
    }

    const result = await moverOportunidad(draggedItem.id, nuevaEtapa)
    if (result.success) {
      toast.success(`Oportunidad movida a ${ETAPAS_PIPELINE.find(e => e.id === nuevaEtapa)?.nombre}`)
    } else {
      toast.error(result.error)
      loadPipeline() // Revert on error
    }
    setDraggedItem(null)
  }

  // Calculate totals
  const allOpportunities = pipeline
    ? Object.values(pipeline).flat()
    : []
  const totalMonto = allOpportunities.reduce((sum, o) => sum + o.monto, 0)
  const totalOportunidades = allOpportunities.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/crm")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pipeline de Ventas</h1>
            <p className="text-sm text-muted-foreground">
              {totalOportunidades} oportunidades | ${totalMonto.toLocaleString("es-MX", { minimumFractionDigits: 0 })} en pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-foreground text-background" : "bg-card hover:bg-muted"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "bg-card hover:bg-muted"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio, evento, cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="spark-card p-4 flex flex-wrap gap-3">
            <Select
              value={filtros.tipoEvento || "todos"}
              onValueChange={(v) => setFiltros(prev => ({ ...prev, tipoEvento: v === "todos" ? undefined : v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_EVENTO.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Desde"
              value={filtros.fechaDesde || ""}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value || undefined }))}
              className="w-[180px]"
            />
            <Input
              type="date"
              placeholder="Hasta"
              value={filtros.fechaHasta || ""}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value || undefined }))}
              className="w-[180px]"
            />
            <Input
              type="number"
              placeholder="Monto min"
              value={filtros.montoMin || ""}
              onChange={(e) => setFiltros(prev => ({ ...prev, montoMin: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-[140px]"
            />
            <Input
              type="number"
              placeholder="Monto max"
              value={filtros.montoMax || ""}
              onChange={(e) => setFiltros(prev => ({ ...prev, montoMax: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-[140px]"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltros({})
                setBusqueda("")
              }}
            >
              Limpiar
            </Button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Kanban View */}
      {!loading && viewMode === "kanban" && pipeline && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
          {ETAPAS_PIPELINE.map((etapa) => {
            const items = pipeline[etapa.id] || []
            const columnTotal = items.reduce((sum, o) => sum + o.monto, 0)
            const isOver = dragOverColumn === etapa.id

            return (
              <div
                key={etapa.id}
                className={`flex-shrink-0 w-[280px] rounded-xl border transition-all ${
                  isOver
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border/50 bg-muted/30"
                }`}
                onDragOver={(e) => handleDragOver(e, etapa.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, etapa.id)}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${etapa.color}`}>
                        {items.length}
                      </Badge>
                      <span className="text-sm font-semibold truncate">{etapa.nombre}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${(columnTotal / 1000).toFixed(0)}k
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Sin oportunidades
                    </div>
                  )}
                  {items.map((oportunidad) => (
                    <OpportunityCard
                      key={oportunidad.id}
                      oportunidad={oportunidad}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === "list" && pipeline && (
        <div className="spark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Folio</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Evento</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Hotel</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Etapa</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Fecha Evento</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Dias</th>
                </tr>
              </thead>
              <tbody>
                {allOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      No se encontraron oportunidades
                    </td>
                  </tr>
                ) : (
                  allOpportunities.map((oportunidad) => {
                    const etapaInfo = ETAPAS_PIPELINE.find(e => e.id === oportunidad.etapa)
                    return (
                      <tr
                        key={oportunidad.id}
                        className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/cotizaciones/${oportunidad.id}`)}
                      >
                        <td className="p-3 text-sm font-mono">{oportunidad.folio}</td>
                        <td className="p-3">
                          <div className="text-sm font-medium truncate max-w-[200px]">{oportunidad.nombreEvento}</div>
                          <div className="text-xs text-muted-foreground">{oportunidad.tipoEvento}</div>
                        </td>
                        <td className="p-3 text-sm">{oportunidad.clienteNombre}</td>
                        <td className="p-3 text-sm text-muted-foreground truncate max-w-[150px]">
                          {oportunidad.hotelNombre}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={`text-xs ${etapaInfo?.color || ""}`}>
                            {etapaInfo?.nombre || oportunidad.etapa}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm font-semibold text-right">
                          ${oportunidad.monto.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {oportunidad.fechaEvento
                            ? new Date(oportunidad.fechaEvento).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-medium ${
                            oportunidad.diasDesdeUltimaActividad > 7
                              ? "text-destructive"
                              : oportunidad.diasDesdeUltimaActividad > 3
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}>
                            {oportunidad.diasDesdeUltimaActividad}d
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================================================
  Opportunity Card (Kanban)
================================================== */
function OpportunityCard({
  oportunidad,
  onDragStart,
  onDragEnd,
}: {
  oportunidad: oOportunidad
  onDragStart: (e: React.DragEvent, item: oOportunidad) => void
  onDragEnd: (e: React.DragEvent) => void
}) {
  return (
    <Link href={`/cotizaciones/${oportunidad.id}`}>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          onDragStart(e, oportunidad)
        }}
        onDragEnd={onDragEnd}
        className="spark-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
      >
        {/* Drag handle + Client */}
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{oportunidad.clienteNombre}</p>
            <p className="text-xs text-muted-foreground truncate">{oportunidad.nombreEvento}</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-2 space-y-1.5">
          {/* Event type + Date */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{oportunidad.tipoEvento}</span>
            {oportunidad.fechaEvento && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(oportunidad.fechaEvento).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">
              ${oportunidad.monto.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </span>
            {oportunidad.diasDesdeUltimaActividad > 5 && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {oportunidad.diasDesdeUltimaActividad}d
              </span>
            )}
          </div>

          {/* Hotel + Salon */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{oportunidad.hotelNombre}</span>
            {oportunidad.salonNombre && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="truncate">{oportunidad.salonNombre}</span>
              </>
            )}
          </div>
        </div>

        {/* Folio badge */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">{oportunidad.folio}</span>
          {oportunidad.vendedorNombre && (
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
