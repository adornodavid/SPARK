"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays, CalendarRange, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerEventosPorHotel } from "@/app/actions/cotizaciones"
import { getEstatusComercialStyle, normalizarEstatusComercial, type EstatusComercial } from "./estatus-comercial-colors"

/* ==================================================
  Types
================================================== */
interface CalendarEvent {
  id: number; nombreevento: string; salonName: string; salonid: number
  fechainicio: string; fechafin: string; horainicio: string; horafin: string
  estatus: string; cliente: string; numeroinvitados: number
  tipo: "reservacion" | "cotizacion"
  estatuscomercial: EstatusComercial | null
  totalmonto: number
}
type ViewMode = "day" | "week" | "month"
interface SalonItem { value: string; text: string }

interface DashboardAvailabilityCalendarProps {
  hotelId: string
  selectedSalon?: string
  filters?: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }
  onDayClick?: (dateStr: string) => void
}

/* ==================================================
  Constants
================================================== */
const HOURS = (() => {
  const h: { value: string; label: string; hour24: number }[] = []
  function fmt(hr: number) { if (hr === 0 || hr === 24) return "12AM"; if (hr === 12) return "12PM"; return hr > 12 ? `${hr - 12}PM` : `${hr}AM` }
  for (let i = 8; i <= 23; i++) { h.push({ value: `${i.toString().padStart(2, "0")}:00`, label: `${fmt(i)}-${fmt(i + 1)}`, hour24: i }) }
  for (let i = 0; i <= 2; i++) { h.push({ value: `${i.toString().padStart(2, "0")}:00`, label: `${fmt(i)}-${fmt(i + 1)}`, hour24: i }) }
  return h
})()
const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

/* ==================================================
  Helpers
================================================== */
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function fmtMonto(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return `$${Math.round(n)}`
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function getWeekStart(d: Date) { const r = new Date(d); r.setDate(r.getDate() - (r.getDay() === 0 ? 6 : r.getDay() - 1)); return r }
function parseHour(t: string) { if (!t) return -1; return parseInt(t.split(":")[0], 10) }
function getEventBarColor(ev: CalendarEvent) {
  return getEstatusComercialStyle(ev.estatuscomercial).dot
}

/* ==================================================
  Main Component
================================================== */
export default function DashboardAvailabilityCalendar({ hotelId, selectedSalon = "all", filters, onDayClick }: DashboardAvailabilityCalendarProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [previousView, setPreviousView] = useState<ViewMode | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [salones, setSalones] = useState<SalonItem[]>([])
  const [loading, setLoading] = useState(false)

  const salonNameMap = useMemo(() => { const m = new Map<string, string>(); for (const s of salones) m.set(s.value, s.text); return m }, [salones])

  // Load salones when hotel changes
  useEffect(() => {
    if (!hotelId || hotelId === "all") { setSalones([]); return }
    fetch(`/api/salones?hotelid=${hotelId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) setSalones(result.data)
        else setSalones([])
      })
      .catch(() => setSalones([]))
  }, [hotelId])

  const dateRange = useMemo(() => {
    if (viewMode === "day") return { start: new Date(currentDate), end: new Date(currentDate) }
    if (viewMode === "week") { const s = getWeekStart(currentDate); return { start: s, end: addDays(s, 6) } }
    return { start: new Date(currentDate.getFullYear(), 0, 1), end: new Date(currentDate.getFullYear(), 11, 31) }
  }, [viewMode, currentDate])

  const reqIdRef = useRef(0)

  useEffect(() => {
    // Si no hay hotel específico, limpiamos events y salimos sin spinner.
    if (!hotelId || hotelId === "all") {
      setEvents([])
      setLoading(false)
      return
    }
    const reqId = ++reqIdRef.current
    let cancelado = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await obtenerEventosPorHotel(Number(hotelId), toDateStr(dateRange.start), toDateStr(dateRange.end))
        if (cancelado || reqId !== reqIdRef.current) return
        const byKey = new Map<string, CalendarEvent>()
        if (result.success && result.data) {
          for (const e of result.data) {
            const tipo = String(e.tiporegistro).toLowerCase() === "reservacion" ? "reservacion" : "cotizacion"
            const k = `${tipo}-${e.id}-${e.salonid}`
            if (byKey.has(k)) continue
            byKey.set(k, {
              id: e.id, nombreevento: e.nombreevento || (tipo === "reservacion" ? "Reservación" : "Cotización"),
              salonName: e.salon || salonNameMap.get(String(e.salonid)) || "Salón",
              salonid: e.salonid, fechainicio: e.fechainicio, fechafin: e.fechafin,
              horainicio: e.horainicio || "", horafin: e.horafin || "",
              estatus: e.estatus || "", cliente: e.cliente || "",
              numeroinvitados: e.numeroinvitados || 0, tipo,
              estatuscomercial: normalizarEstatusComercial(e.estatuscomercial),
              totalmonto: Number(e.totalmonto) || 0,
            })
          }
        }
        if (!cancelado && reqId === reqIdRef.current) setEvents(Array.from(byKey.values()))
      } catch (err) {
        console.error("[DashboardAvailabilityCalendar] fetch error:", err)
        if (!cancelado && reqId === reqIdRef.current) setEvents([])
      } finally {
        if (!cancelado && reqId === reqIdRef.current) setLoading(false)
      }
    })()
    return () => { cancelado = true }
  }, [hotelId, dateRange, salonNameMap])

  function goToDayView(date: Date, from: ViewMode) { setPreviousView(from); setCurrentDate(date); setViewMode("day") }
  function goBack() { if (previousView) { setViewMode(previousView); setPreviousView(null) } }
  function navigate(dir: -1 | 1) {
    setCurrentDate((p) => {
      const d = new Date(p)
      if (viewMode === "day") d.setDate(d.getDate() + dir)
      else if (viewMode === "week") d.setDate(d.getDate() + dir * 7)
      else d.setFullYear(d.getFullYear() + dir)
      return d
    })
  }

  // Aplica los filtros de estatuscomercial antes de consumir `events` en las celdas.
  const filteredEvents = useMemo(() => {
    if (!filters) return events
    return events.filter((e) => {
      if (e.estatuscomercial === "Tentativo" && !filters.tentativo) return false
      if (e.estatuscomercial === "Definitivo" && !filters.definitivo) return false
      if (e.estatuscomercial === "Cancelado" && !filters.cancelado) return false
      return true
    })
  }, [events, filters])

  function getEventsForCell(sId: string, ds: string) { return filteredEvents.filter((e) => e.salonid === Number(sId) && e.fechainicio <= ds && e.fechafin >= ds) }
  function getEventsForHourCell(sId: string, ds: string, hr: number) {
    return filteredEvents.filter((e) => {
      if (e.salonid !== Number(sId) || e.fechainicio > ds || e.fechafin < ds) return false
      const s = parseHour(e.horainicio), en = parseHour(e.horafin)
      if (s < 0 || en < 0) return true
      return s <= en ? (hr >= s && hr < en) : (hr >= s || hr < en)
    })
  }

  const title = useMemo(() => {
    if (viewMode === "day") { const d = currentDate; return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}` }
    if (viewMode === "week") { const s = dateRange.start, e = dateRange.end; return s.getMonth() === e.getMonth() ? `${s.getDate()} – ${e.getDate()} de ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}` : `${s.getDate()} ${MONTHS_ES[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_ES[e.getMonth()].slice(0, 3)} ${e.getFullYear()}` }
    return `${currentDate.getFullYear()}`
  }, [viewMode, currentDate, dateRange])

  const weekDays = useMemo(() => { const d: Date[] = [], s = getWeekStart(currentDate); for (let i = 0; i < 7; i++) d.push(addDays(s, i)); return d }, [currentDate])
  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date())
  const isPast = (d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))

  if (!hotelId || hotelId === "all") {
    return (
      <div className="lg:col-span-3 border border-blue-100 rounded-xl bg-blue-50/30 p-12 text-center">
        <Calendar className="w-12 h-12 text-blue-200 mx-auto mb-3" />
        <p className="text-sm text-blue-400 font-medium">Selecciona un hotel específico para ver la vista de disponibilidad</p>
        <p className="text-xs text-blue-300 mt-1">Esta vista muestra los salones y horarios por hotel</p>
      </div>
    )
  }

  if (salones.length === 0) {
    return (
      <div className="lg:col-span-3 border border-blue-100 rounded-xl bg-blue-50/30 p-12 text-center">
        <Calendar className="w-12 h-12 text-blue-200 mx-auto mb-3" />
        <p className="text-sm text-blue-400">Cargando salones...</p>
      </div>
    )
  }

  return (
    <div className="lg:col-span-3 border border-blue-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          {viewMode === "day" && previousView && (
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md px-2 py-1 mr-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          )}
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900">{title}</h3>
          {loading && <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-white rounded-lg border border-blue-200 p-0.5 mr-2">
            {(["day", "week", "month"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setViewMode(m); setPreviousView(null) }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === m ? "bg-blue-600 text-white shadow-sm" : "text-blue-600 hover:bg-blue-50"}`}>
                {m === "day" && <><Clock className="w-3 h-3" /> Día</>}
                {m === "week" && <><CalendarDays className="w-3 h-3" /> Semana</>}
                {m === "month" && <><CalendarRange className="w-3 h-3" /> Mes</>}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50">Hoy</Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 text-blue-600 hover:bg-blue-100"><ChevronLeft className="w-4 h-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(1)} className="h-7 w-7 text-blue-600 hover:bg-blue-100"><ChevronRight className="w-4 h-4" /></Button>
          <div className="w-px h-5 bg-blue-200 mx-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/reservacion-interna/new")}
            className="gap-1 h-7 text-xs border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Reservación Interna
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams()
              if (hotelId !== "all") params.set("hotelId", hotelId)
              if (selectedSalon !== "all") params.set("salonId", selectedSalon)
              const qs = params.toString()
              router.push(`/cotizaciones/new${qs ? `?${qs}` : ""}`)
            }}
            className="gap-1 h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Generar Cotizacion
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto overflow-x-auto max-h-[520px]">
        {viewMode === "day" && (
          <DayView date={currentDate} salones={salones} getEventsForHourCell={getEventsForHourCell}
            onCellClick={(dateStr) => onDayClick?.(dateStr)} />
        )}
        {viewMode === "week" && (
          <WeekView days={weekDays} salones={salones} getEventsForCell={getEventsForCell}
            onDayClick={(d) => goToDayView(d, "week")}
            isToday={isToday} isPast={isPast} />
        )}
        {viewMode === "month" && (
          <MonthView year={currentDate.getFullYear()} salones={salones} events={filteredEvents}
            onMonthClick={(month) => {
              const now = new Date()
              const yr = currentDate.getFullYear()
              if (yr === now.getFullYear() && month === now.getMonth()) setCurrentDate(now)
              else setCurrentDate(new Date(yr, month, 1))
              setViewMode("week"); setPreviousView("month")
            }} />
        )}
      </div>

      {/* Legend — estatus comercial */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-blue-100 bg-gray-50/50 flex-wrap">
        <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Leyenda:</span>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-[10px] text-gray-600">Tentativo</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-700" /><span className="text-[10px] text-gray-600">Definitivo</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-700" /><span className="text-[10px] text-gray-600">Cancelado</span></div>
      </div>
    </div>
  )
}

/* ==================================================
  Day View — read-only with event bars
================================================== */
function DayView({ date, salones, getEventsForHourCell, onCellClick }: {
  date: Date; salones: SalonItem[]
  getEventsForHourCell: (s: string, d: string, h: number) => CalendarEvent[]
  onCellClick?: (dateStr: string) => void
}) {
  const dateStr = toDateStr(date)
  const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0))

  function getEventSpanPos(ev: CalendarEvent, hour: number): "start" | "middle" | "end" | "single" {
    const eStart = parseHour(ev.horainicio)
    const eEnd = parseHour(ev.horafin)
    if (eStart < 0 || eEnd < 0) return "middle"
    const lastHour = eEnd > 0 ? eEnd - 1 : eEnd
    if (eStart === lastHour) return "single"
    if (hour === eStart) return "start"
    if (hour === lastHour) return "end"
    return "middle"
  }

  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[120px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {HOURS.map((h) => <th key={h.value} className="text-center p-1 font-medium text-blue-700 border-b border-r border-blue-100 whitespace-nowrap text-[10px]">{h.label}</th>)}
      </tr></thead>
      <tbody>
        {salones.map((salon) => (
          <tr key={salon.value} className="group hover:bg-blue-50/20">
            <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 truncate w-[120px]">{salon.text}</td>
            {HOURS.map((h) => {
              const evts = getEventsForHourCell(salon.value, dateStr, h.hour24)
              const primary = evts[0]

              return (
                <td key={h.value}
                  className={`border-b border-r border-blue-50 relative transition-colors h-[40px] select-none ${
                    isPastDay ? "bg-gray-50" : primary ? "cursor-pointer" : "hover:bg-blue-50/30"
                  }`}
                  onClick={() => onCellClick?.(dateStr)}
                  title={primary ? `${(getEstatusComercialStyle(primary.estatuscomercial).label).toUpperCase()}: ${primary.nombreevento}\n${primary.horainicio?.slice(0, 5)} – ${primary.horafin?.slice(0, 5)}\nCliente: ${primary.cliente}\nTotal: ${fmtMonto(primary.totalmonto)}` : "Disponible"}>
                  {primary && (() => {
                    const pos = getEventSpanPos(primary, h.hour24)
                    const roundL = pos === "start" || pos === "single" ? "rounded-l" : ""
                    const roundR = pos === "end" || pos === "single" ? "rounded-r" : ""
                    const insetL = pos === "start" || pos === "single" ? "left-0.5" : "left-0"
                    const insetR = pos === "end" || pos === "single" ? "right-0.5" : "right-0"
                    const showLabel = pos === "start" || pos === "single"
                    return (
                      <div className={`absolute top-1 bottom-1 ${insetL} ${insetR} ${roundL} ${roundR} ${getEventBarColor(primary)} opacity-85`}>
                        {showLabel && (
                          <div className="absolute inset-0 flex items-center pl-1.5">
                            <span className="text-[9px] font-bold truncate text-white">{primary.nombreevento?.slice(0, 12)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ==================================================
  Week View — read-only
================================================== */
function WeekView({ days, salones, getEventsForCell, onDayClick, isToday, isPast }: {
  days: Date[]; salones: SalonItem[]; getEventsForCell: (s: string, d: string) => CalendarEvent[]
  onDayClick: (d: Date) => void
  isToday: (d: Date) => boolean; isPast: (d: Date) => boolean
}) {
  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[120px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {days.map((d) => {
          const t = isToday(d)
          return (
            <th key={toDateStr(d)} className={`text-center p-2 border-b border-r border-blue-100 ${t ? "bg-blue-600 text-white" : "text-blue-700"}`}>
              <div className="text-[10px] uppercase tracking-wide">{DAYS_ES[d.getDay()]}</div>
              <div className={`text-base font-bold ${t ? "text-white" : "text-blue-900"}`}>{d.getDate()}</div>
            </th>
          )
        })}
      </tr></thead>
      <tbody>{salones.map((salon) => (
        <tr key={salon.value} className="group">
          <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 truncate w-[120px]">{salon.text}</td>
          {days.map((d) => {
            const ds = toDateStr(d), evts = getEventsForCell(salon.value, ds)
            const past = isPast(d)
            let tentativo = 0, definitivo = 0, cancelado = 0
            let totTent = 0, totDef = 0, totCanc = 0
            for (const e of evts) {
              if (e.estatuscomercial === "Tentativo") { tentativo++; totTent += e.totalmonto }
              else if (e.estatuscomercial === "Definitivo") { definitivo++; totDef += e.totalmonto }
              else if (e.estatuscomercial === "Cancelado") { cancelado++; totCanc += e.totalmonto }
            }
            const total = tentativo + definitivo + cancelado

            return (
              <td key={ds} className={`border-b border-r border-blue-50 p-1.5 align-top min-h-[56px] h-[56px] transition-all ${
                past ? "bg-gray-50/80" : "cursor-pointer hover:bg-blue-50/50"
              }`} onClick={() => { if (!past) onDayClick(d) }}>
                {total > 0 ? (
                  <div className="space-y-0.5">
                    {tentativo > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" /><span className="text-[10px] text-yellow-800 font-semibold">{tentativo} tent. {fmtMonto(totTent)}</span></div>}
                    {definitivo > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-700 flex-shrink-0" /><span className="text-[10px] text-emerald-800 font-semibold">{definitivo} def. {fmtMonto(totDef)}</span></div>}
                    {cancelado > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-700 flex-shrink-0" /><span className="text-[10px] text-red-800 font-semibold">{cancelado} canc. {fmtMonto(totCanc)}</span></div>}
                  </div>
                ) : !past ? (
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-30">
                    <span className="text-[10px] text-blue-400">Disponible</span>
                  </div>
                ) : null}
              </td>
            )
          })}
        </tr>
      ))}</tbody>
    </table>
  )
}

/* ==================================================
  Month View — read-only
================================================== */
function MonthView({ year, salones, events, onMonthClick }: {
  year: number; salones: SalonItem[]; events: CalendarEvent[]
  onMonthClick: (month: number) => void
}) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  function getMonthCounts(salonId: string, month: number) {
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`
    let tentativo = 0, definitivo = 0, cancelado = 0
    let totTent = 0, totDef = 0, totCanc = 0
    for (const e of events) {
      if (e.salonid !== Number(salonId)) continue
      if (e.fechainicio > monthEnd || e.fechafin < monthStart) continue
      if (e.estatuscomercial === "Tentativo") { tentativo++; totTent += e.totalmonto }
      else if (e.estatuscomercial === "Definitivo") { definitivo++; totDef += e.totalmonto }
      else if (e.estatuscomercial === "Cancelado") { cancelado++; totCanc += e.totalmonto }
    }
    return { tentativo, definitivo, cancelado, totTent, totDef, totCanc }
  }

  const isPastMonth = (m: number) => year < currentYear || (year === currentYear && m < currentMonth)
  const isCurrentMonth = (m: number) => year === currentYear && m === currentMonth

  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10">
        <tr className="bg-blue-50">
          <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[120px] sticky left-0 bg-blue-50 z-20">Salón</th>
          {MONTHS_SHORT.map((m, i) => (
            <th key={i} className={`text-center p-2 font-medium border-b border-r border-blue-100 ${
              isCurrentMonth(i) ? "bg-blue-600 text-white" : isPastMonth(i) ? "text-gray-400" : "text-blue-700"
            }`}>{m}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {salones.map((salon) => (
          <tr key={salon.value} className="group">
            <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 truncate w-[120px]">{salon.text}</td>
            {MONTHS_SHORT.map((_, month) => {
              const { tentativo, definitivo, cancelado, totTent, totDef, totCanc } = getMonthCounts(salon.value, month)
              const past = isPastMonth(month)
              const current = isCurrentMonth(month)
              const total = tentativo + definitivo + cancelado

              // Total monto programado: tentativo + definitivo (excluye cancelado).
              // Solo en vista Mes — representa "total de cotizaciones y eventos programados".
              const totalProgramado = totTent + totDef

              return (
                <td key={month} className={`border-b border-r border-blue-50 p-1.5 align-top transition-all min-h-[52px] ${
                  past ? "bg-gray-50/50 cursor-not-allowed"
                  : current ? "bg-blue-50 cursor-pointer hover:bg-blue-100"
                  : "cursor-pointer hover:bg-blue-50"
                }`} onClick={() => onMonthClick(month)}>
                  {total > 0 ? (
                    <div className="space-y-0.5">
                      {tentativo > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" /><span className="text-[10px] text-yellow-800 font-semibold">{tentativo} tent.</span></div>}
                      {definitivo > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-700 flex-shrink-0" /><span className="text-[10px] text-emerald-800 font-semibold">{definitivo} def.</span></div>}
                      {cancelado > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-700 flex-shrink-0" /><span className="text-[10px] text-red-800 font-semibold">{cancelado} canc.</span></div>}
                      <div className="mt-0.5 px-1 py-0 rounded bg-blue-50 border border-blue-200 text-center">
                        <span className="text-[9px] font-semibold text-blue-700 tracking-tight leading-tight">{fmtMonto(totalProgramado)}</span>
                      </div>
                    </div>
                  ) : !past ? (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                      <span className="text-[9px] text-blue-400">Ver →</span>
                    </div>
                  ) : null}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
