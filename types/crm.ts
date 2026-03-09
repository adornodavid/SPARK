/* ==================================================
  CRM Types — Phase 7
  --------------------
  * Interfaces:
    - oCRMDashboard
    - oOportunidad (Pipeline card / Opportunity)
    - oActividad (Activity)
    - oTimelineEntry
    - oCliente360
    - oPipelineFiltros
    - oEtapaPipeline
    - oCRMKPI
    - oCommandResult
================================================== */

// Pipeline stages — derived from cotizacion status flow
export const ETAPAS_PIPELINE = [
  { id: "prospecto", nombre: "Prospecto", orden: 1, color: "bg-muted text-muted-foreground", esGanada: false, esPerdida: false },
  { id: "visita_programada", nombre: "Visita Programada", orden: 2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", esGanada: false, esPerdida: false },
  { id: "demo_realizada", nombre: "Demo Realizada", orden: 3, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", esGanada: false, esPerdida: false },
  { id: "cotizada", nombre: "Cotizada", orden: 4, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", esGanada: false, esPerdida: false },
  { id: "en_seguimiento", nombre: "En Seguimiento", orden: 5, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", esGanada: false, esPerdida: false },
  { id: "negociacion", nombre: "Negociacion", orden: 6, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", esGanada: false, esPerdida: false },
  { id: "pagada", nombre: "Pagada", orden: 7, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", esGanada: false, esPerdida: false },
  { id: "confirmada", nombre: "Confirmada", orden: 8, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", esGanada: true, esPerdida: false },
  { id: "realizada", nombre: "Realizada", orden: 9, color: "bg-primary/20 text-primary-foreground", esGanada: true, esPerdida: false },
  { id: "perdida", nombre: "Perdida", orden: 10, color: "bg-destructive/10 text-destructive", esGanada: false, esPerdida: true },
] as const

export type EtapaPipelineId = typeof ETAPAS_PIPELINE[number]["id"]

// Activity types
export const TIPOS_ACTIVIDAD = [
  { id: "llamada", nombre: "Llamada", icon: "Phone" },
  { id: "email", nombre: "Email", icon: "Mail" },
  { id: "reunion", nombre: "Reunion", icon: "Users" },
  { id: "visita", nombre: "Visita", icon: "MapPin" },
  { id: "envio_cotizacion", nombre: "Envio de Cotizacion", icon: "FileText" },
  { id: "seguimiento", nombre: "Seguimiento", icon: "Clock" },
  { id: "tarea", nombre: "Tarea Personalizada", icon: "CheckSquare" },
] as const

export type TipoActividadId = typeof TIPOS_ACTIVIDAD[number]["id"]

// Lead scoring
export const SCORING_LEVELS = [
  { id: "caliente", nombre: "Caliente", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: "Flame" },
  { id: "tibio", nombre: "Tibio", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "Thermometer" },
  { id: "frio", nombre: "Frio", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "Snowflake" },
] as const

export type ScoringLevel = typeof SCORING_LEVELS[number]["id"]

// Lead origins
export const ORIGENES_LEAD = [
  { id: "walk-in", nombre: "Walk-in" },
  { id: "web", nombre: "Sitio Web" },
  { id: "referido", nombre: "Referido" },
  { id: "redes", nombre: "Redes Sociales" },
  { id: "telefono", nombre: "Llamada Telefonica" },
  { id: "email", nombre: "Email" },
  { id: "evento", nombre: "Evento / Feria" },
] as const

// Opportunity (pipeline card) — derived from cotizaciones data
export interface oOportunidad {
  id: number
  folio: string
  clienteId: number
  clienteNombre: string
  clienteEmail: string | null
  clienteTelefono: string | null
  etapa: EtapaPipelineId
  hotelId: number
  hotelNombre: string
  salonId: number | null
  salonNombre: string | null
  fechaEvento: string | null
  monto: number
  tipoEvento: string
  vendedorId: number | null
  vendedorNombre: string | null
  nombreEvento: string
  numeroinvitados: number | null
  validohasta: string | null
  diasDesdeUltimaActividad: number
  fechaCreacion: string
  fechaActualizacion: string | null
}

// Activity
export interface oActividad {
  id: number
  tipo: TipoActividadId
  fecha: string
  hora: string | null
  descripcion: string
  clienteId: number
  clienteNombre: string | null
  oportunidadId: number | null
  oportunidadFolio: string | null
  vendedorId: number
  vendedorNombre: string | null
  completada: boolean
  resultado: string | null
  notas: string | null
  fechaCreacion: string
}

// Timeline entry (for Client 360)
export interface oTimelineEntry {
  id: string
  tipo: "actividad" | "cotizacion" | "reservacion" | "nota" | "cambio_estatus"
  titulo: string
  descripcion: string | null
  fecha: string
  icono: string
  color: string
  metadata?: Record<string, any>
}

// Client 360 full profile
export interface oCliente360 {
  cliente: any // oClientes from existing type
  scoring: ScoringLevel
  tags: string[]
  timeline: oTimelineEntry[]
  cotizaciones: any[]
  reservaciones: any[]
  actividades: oActividad[]
  estadisticas: {
    totalCotizaciones: number
    totalReservaciones: number
    montoTotal: number
    ultimaActividad: string | null
  }
}

// CRM Dashboard KPIs
export interface oCRMKPI {
  cotizacionesDelMes: number
  tasaConversion: number
  revenueMensual: number
  clientesNuevos: number
  diasPromedioParaCerrar: number
}

// CRM Dashboard data
export interface oCRMDashboard {
  kpis: oCRMKPI
  pipelineResumen: { etapa: EtapaPipelineId; cantidad: number; monto: number }[]
  actividadesHoy: oActividad[]
  cotizacionesPorVencer: any[]
  actividadReciente: oTimelineEntry[]
}

// Pipeline filters
export interface oPipelineFiltros {
  vendedorId?: number
  hotelId?: number
  tipoEvento?: string
  fechaDesde?: string
  fechaHasta?: string
  montoMin?: number
  montoMax?: number
  busqueda?: string
}

// Command palette search result
export interface oCommandResult {
  id: string
  tipo: "cliente" | "cotizacion" | "reservacion"
  titulo: string
  subtitulo: string
  url: string
  icono: string
}
