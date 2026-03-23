"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays, CalendarRange, ArrowLeft, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerReservacionesPorHotel } from "@/app/actions/reservaciones"
import { obtenerCotizacionesPorHotel } from "@/app/actions/cotizaciones"
import type { ddlItem } from "@/types/common"

/* ==================================================
  Types
================================================== */
interface CalendarEvent {
  id: number; nombreevento: string; salonName: string; salonid: number
  fechainicio: string; fechafin: string; horainicio: string; horafin: string
  estatus: string; cliente: string; numeroinvitados: number
  tipo: "reservacion" | "cotizacion"
}
type ViewMode = "day" | "week" | "month"

interface AvailabilityCalendarProps {
  hotelId: string; salones: ddlItem[]
  onSelectSlot: (fecha: string, salonId: string, horaPreMontaje?: string, horaInicio?: string, horaFin?: string, horaPostMontaje?: string, horasExtras?: number) => void
  selectedFechaInicio?: string; selectedFechaFin?: string; selectedSalonId?: string
  selectedHoraPreMontaje?: string; selectedHoraInicio?: string; selectedHoraFin?: string; selectedHoraPostMontaje?: string
}

interface SelectionState {
  salonId: string; dateStr: string; coreStartIdx: number
  extrasBefore: number; extrasAfter: number
}

/* ==================================================
  Constants
================================================== */
const HOURS = (() => {
  const h: { value: string; label: string; hour24: number }[] = []
  for (let i = 8; i <= 23; i++) { const h12 = i > 12 ? i - 12 : i === 0 ? 12 : i; h.push({ value: `${i.toString().padStart(2, "0")}:00`, label: `${h12} ${i < 12 ? "AM" : "PM"}`, hour24: i }) }
  for (let i = 0; i <= 2; i++) { h.push({ value: `${i.toString().padStart(2, "0")}:00`, label: `${i === 0 ? 12 : i} AM`, hour24: i }) }
  return h
})()
const BLOCK_SIZE = 10 // 1 pre + 8 event + 1 post
const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

/* ==================================================
  Helpers
================================================== */
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function getWeekStart(d: Date) { const r = new Date(d); r.setDate(r.getDate() - (r.getDay() === 0 ? 6 : r.getDay() - 1)); return r }
function getMonthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function getMonthEnd(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function parseHour(t: string) { if (!t) return -1; return parseInt(t.split(":")[0], 10) }
function getHourIdx(v: string) { return HOURS.findIndex((h) => h.value === v) }
function getEventBarColor(ev: CalendarEvent) { if (ev.tipo === "reservacion") { const e = ev.estatus?.toLowerCase() || ""; if (e.includes("confirm")) return "bg-red-500"; if (e.includes("cancel")) return "bg-gray-400"; return "bg-red-400" } return "bg-amber-400" }

/* ==================================================
  Main Component
================================================== */
export function AvailabilityCalendar({
  hotelId, salones, onSelectSlot,
  selectedFechaInicio, selectedFechaFin, selectedSalonId,
  selectedHoraPreMontaje, selectedHoraInicio, selectedHoraFin, selectedHoraPostMontaje,
}: AvailabilityCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [previousView, setPreviousView] = useState<ViewMode | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [hoverBlock, setHoverBlock] = useState<{ salonId: string; startIdx: number } | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)

  // Drag state
  const [dragging, setDragging] = useState<"left" | "right" | null>(null)
  const dragStartRef = useRef<{ extrasBefore: number; extrasAfter: number; startMouseIdx: number } | null>(null)

  const salonNameMap = useMemo(() => { const m = new Map<string, string>(); for (const s of salones) m.set(s.value, s.text); return m }, [salones])

  const dateRange = useMemo(() => {
    if (viewMode === "day") return { start: new Date(currentDate), end: new Date(currentDate) }
    if (viewMode === "week") { const s = getWeekStart(currentDate); return { start: s, end: addDays(s, 6) } }
    return { start: getMonthStart(currentDate), end: getMonthEnd(currentDate) }
  }, [viewMode, currentDate])

  const loadEvents = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    const [resR, cotR] = await Promise.all([
      obtenerReservacionesPorHotel(Number(hotelId), toDateStr(dateRange.start), toDateStr(dateRange.end)),
      obtenerCotizacionesPorHotel(Number(hotelId), toDateStr(dateRange.start), toDateStr(dateRange.end)),
    ])
    const all: CalendarEvent[] = []
    if (resR.success && resR.data) for (const r of resR.data) all.push({ id: r.id, nombreevento: r.nombreevento || "Reservación", salonName: r.salon || salonNameMap.get(String(r.salonid)) || "Salón", salonid: r.salonid, fechainicio: r.fechainicio, fechafin: r.fechafin, horainicio: r.horainicio || "", horafin: r.horafin || "", estatus: r.estatus || "", cliente: r.cliente || "", numeroinvitados: r.numeroinvitados || 0, tipo: "reservacion" })
    if (cotR.success && cotR.data) for (const c of cotR.data) all.push({ id: c.id, nombreevento: c.nombreevento || "Cotización", salonName: salonNameMap.get(String(c.salonid)) || "Salón", salonid: c.salonid, fechainicio: c.fechainicio, fechafin: c.fechafin, horainicio: c.horainicio || "", horafin: c.horafin || "", estatus: c.estatus || "", cliente: c.cliente || "", numeroinvitados: c.numeroinvitados || 0, tipo: "cotizacion" })
    setEvents(all); setLoading(false)
  }, [hotelId, dateRange, salonNameMap])

  useEffect(() => { loadEvents() }, [loadEvents])

  function goToDayView(date: Date, from: ViewMode) { setPreviousView(from); setCurrentDate(date); setViewMode("day") }
  function goBack() { if (previousView) { setViewMode(previousView); setPreviousView(null) } }
  function navigate(dir: -1 | 1) { setCurrentDate((p) => { const d = new Date(p); if (viewMode === "day") d.setDate(d.getDate() + dir); else if (viewMode === "week") d.setDate(d.getDate() + dir * 7); else d.setMonth(d.getMonth() + dir); return d }) }

  function getEventsForCell(sId: string, ds: string) { return events.filter((e) => e.salonid === Number(sId) && e.fechainicio <= ds && e.fechafin >= ds) }
  function getEventsForHourCell(sId: string, ds: string, hr: number) {
    return events.filter((e) => { if (e.salonid !== Number(sId) || e.fechainicio > ds || e.fechafin < ds) return false; const s = parseHour(e.horainicio), en = parseHour(e.horafin); if (s < 0 || en < 0) return true; return s <= en ? (hr >= s && hr < en) : (hr >= s || hr < en) })
  }
  function cellHasRes(sId: string, ds: string) { return events.some((e) => e.tipo === "reservacion" && e.salonid === Number(sId) && e.fechainicio <= ds && e.fechafin >= ds) }
  function hourHasRes(sId: string, ds: string, hr: number) { return getEventsForHourCell(sId, ds, hr).some((e) => e.tipo === "reservacion") }
  function isCellSel(sId: string, ds: string) { if (!selectedSalonId || !selectedFechaInicio || sId !== selectedSalonId) return false; return selectedFechaFin ? (ds >= selectedFechaInicio && ds <= selectedFechaFin) : ds === selectedFechaInicio }
  function blockHasRes(sId: string, ds: string, start: number) { for (let i = start; i < start + BLOCK_SIZE && i < HOURS.length; i++) if (hourHasRes(sId, ds, HOURS[i].hour24)) return true; return false }

  function emitSelection(sel: SelectionState) {
    const coreEnd = Math.min(sel.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const fullStart = Math.max(sel.coreStartIdx - sel.extrasBefore, 0)
    const fullEnd = Math.min(coreEnd + sel.extrasAfter, HOURS.length - 1)

    // Pre-montaje = siempre la primera hora del rango completo
    // Post-montaje = siempre la última hora del rango completo
    // Hora inicio/fin = el rango completo (pre a post inclusive)
    onSelectSlot(sel.dateStr, sel.salonId,
      HOURS[fullStart].value,     // horaPreMontaje (primera hora, sea extra o core)
      HOURS[fullStart].value,     // horaInicio = inicio del rango completo
      HOURS[fullEnd].value,       // horaFin = fin del rango completo
      HOURS[fullEnd].value,       // horaPostMontaje (última hora, sea extra o core)
      sel.extrasBefore + sel.extrasAfter,
    )
  }

  function handleHourClick(sId: string, ds: string, idx: number) {
    const sel: SelectionState = { salonId: sId, dateStr: ds, coreStartIdx: idx, extrasBefore: 0, extrasAfter: 0 }
    setSelection(sel); emitSelection(sel)
  }

  // Drag handlers for edge handles
  function startDrag(side: "left" | "right", mouseHourIdx: number) {
    if (!selection) return
    setDragging(side)
    dragStartRef.current = { extrasBefore: selection.extrasBefore, extrasAfter: selection.extrasAfter, startMouseIdx: mouseHourIdx }
  }

  function onDragMove(hoverIdx: number) {
    if (!dragging || !selection || !dragStartRef.current) return
    const { startMouseIdx, extrasBefore: origBefore, extrasAfter: origAfter } = dragStartRef.current
    const delta = hoverIdx - startMouseIdx
    const coreEnd = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)

    if (dragging === "left") {
      // Moving left handle: negative delta = more extras before, positive = fewer
      const newExtras = Math.max(0, origBefore - delta)
      // Check bounds
      const newStartIdx = selection.coreStartIdx - newExtras
      if (newStartIdx < 0) return
      // Check for reservaciones in the new extra range
      for (let i = newStartIdx; i < selection.coreStartIdx; i++) {
        if (hourHasRes(selection.salonId, selection.dateStr, HOURS[i].hour24)) return
      }
      const newSel = { ...selection, extrasBefore: newExtras }
      setSelection(newSel); emitSelection(newSel)
    } else {
      // Moving right handle: positive delta = more extras after, negative = fewer
      const newExtras = Math.max(0, origAfter + delta)
      const newEndIdx = coreEnd + newExtras
      if (newEndIdx >= HOURS.length) return
      for (let i = coreEnd + 1; i <= newEndIdx; i++) {
        if (hourHasRes(selection.salonId, selection.dateStr, HOURS[i].hour24)) return
      }
      const newSel = { ...selection, extrasAfter: newExtras }
      setSelection(newSel); emitSelection(newSel)
    }
  }

  function endDrag() { setDragging(null); dragStartRef.current = null }

  const title = useMemo(() => {
    if (viewMode === "day") { const d = currentDate; return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}` }
    if (viewMode === "week") { const s = dateRange.start, e = dateRange.end; return s.getMonth() === e.getMonth() ? `${s.getDate()} – ${e.getDate()} de ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}` : `${s.getDate()} ${MONTHS_ES[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_ES[e.getMonth()].slice(0, 3)} ${e.getFullYear()}` }
    return `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }, [viewMode, currentDate, dateRange])
  const weekDays = useMemo(() => { const d: Date[] = [], s = getWeekStart(currentDate); for (let i = 0; i < 7; i++) d.push(addDays(s, i)); return d }, [currentDate])
  const monthDays = useMemo(() => { const s = getMonthStart(currentDate), e = getMonthEnd(currentDate), fw = s.getDay() === 0 ? 6 : s.getDay() - 1; const d: (Date | null)[] = []; for (let i = 0; i < fw; i++) d.push(null); for (let i = 1; i <= e.getDate(); i++) d.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i)); return d }, [currentDate])
  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date())
  const isPast = (d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))

  if (!hotelId) return <div className="border border-blue-100 rounded-lg bg-blue-50/30 p-8 text-center"><Calendar className="w-10 h-10 text-blue-200 mx-auto mb-2" /><p className="text-sm text-blue-400">Selecciona un hotel para ver la disponibilidad</p></div>
  if (salones.length === 0) return <div className="border border-blue-100 rounded-lg bg-blue-50/30 p-8 text-center"><Calendar className="w-10 h-10 text-blue-200 mx-auto mb-2" /><p className="text-sm text-blue-400">Cargando salones...</p></div>

  return (
    <div className="border border-blue-200 rounded-xl bg-white overflow-hidden shadow-sm"
      onMouseUp={endDrag} onMouseLeave={endDrag}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          {viewMode === "day" && previousView && <button type="button" onClick={goBack} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md px-2 py-1 mr-1"><ArrowLeft className="w-3.5 h-3.5" /> Volver</button>}
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900">{title}</h3>
          {loading && <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
          {viewMode === "day" && selection && (selection.extrasBefore + selection.extrasAfter) > 0 && (
            <span className="text-[10px] font-bold text-teal-700 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full ml-2">
              +{selection.extrasBefore + selection.extrasAfter} hr extra{(selection.extrasBefore + selection.extrasAfter) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {viewMode === "day" && !selection && <span className="text-[10px] text-gray-400 mr-2">Clic en una hora para bloque de 8 hrs</span>}
          {viewMode === "day" && selection && <span className="text-[10px] text-gray-400 mr-2">Arrastra las flechas ◀ ▶ para agregar horas extras</span>}
          <div className="flex bg-white rounded-lg border border-blue-200 p-0.5 mr-2">
            {(["day", "week", "month"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setViewMode(m); setPreviousView(null); setHoverBlock(null) }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === m ? "bg-blue-600 text-white shadow-sm" : "text-blue-600 hover:bg-blue-50"}`}>
                {m === "day" && <><Clock className="w-3 h-3" /> Día</>}{m === "week" && <><CalendarDays className="w-3 h-3" /> Semana</>}{m === "month" && <><CalendarRange className="w-3 h-3" /> Mes</>}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50">Hoy</Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-7 w-7 text-blue-600 hover:bg-blue-100"><ChevronLeft className="w-4 h-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(1)} className="h-7 w-7 text-blue-600 hover:bg-blue-100"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-auto max-h-[420px]">
        {viewMode === "day" && <DayView date={currentDate} salones={salones} getEventsForHourCell={getEventsForHourCell} hourHasRes={hourHasRes} onHourClick={handleHourClick} hoverBlock={hoverBlock} setHoverBlock={setHoverBlock} selection={selection} dragging={dragging} startDrag={startDrag} onDragMove={onDragMove} onClearSelection={() => { setSelection(null) }} />}
        {viewMode === "week" && <WeekView days={weekDays} salones={salones} getEventsForCell={getEventsForCell} onDayClick={(d, s) => { onSelectSlot(toDateStr(d), s); goToDayView(d, "week") }} isCellSel={isCellSel} isToday={isToday} isPast={isPast} hoveredCell={hoveredCell} setHoveredCell={setHoveredCell} />}
        {viewMode === "month" && <MonthView days={monthDays} salones={salones} getEventsForCell={getEventsForCell} onDayClick={(d, s) => { onSelectSlot(toDateStr(d), s); goToDayView(d, "month") }} isCellSel={isCellSel} isToday={isToday} isPast={isPast} />}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-blue-100 bg-gray-50/50 flex-wrap">
        <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Leyenda:</span>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] text-gray-600">Reservación</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[10px] text-gray-600">Cotización</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-purple-300 border border-purple-400" /><span className="text-[10px] text-gray-600">Montaje</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-200 border border-blue-400" /><span className="text-[10px] text-gray-600">Evento</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-teal-300 border border-teal-500" /><span className="text-[10px] text-gray-600">Hora extra</span></div>
      </div>
    </div>
  )
}

/* ==================================================
  Day View — with drag handles at range edges
================================================== */
function DayView({ date, salones, getEventsForHourCell, hourHasRes, onHourClick, hoverBlock, setHoverBlock, selection, dragging, startDrag, onDragMove, onClearSelection }: {
  date: Date; salones: ddlItem[]
  getEventsForHourCell: (s: string, d: string, h: number) => CalendarEvent[]
  hourHasRes: (s: string, d: string, h: number) => boolean
  onHourClick: (s: string, d: string, i: number) => void
  hoverBlock: { salonId: string; startIdx: number } | null
  setHoverBlock: (v: { salonId: string; startIdx: number } | null) => void
  selection: SelectionState | null
  dragging: "left" | "right" | null
  startDrag: (side: "left" | "right", mouseIdx: number) => void
  onDragMove: (hoverIdx: number) => void
  onClearSelection: () => void
}) {
  const dateStr = toDateStr(date)
  const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0))

  // Compute full range
  const selFullStart = selection && selection.dateStr === dateStr ? selection.coreStartIdx - selection.extrasBefore : -1
  const selFullEnd = selection && selection.dateStr === dateStr ? Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1) + (selection?.extrasAfter ?? 0) : -1

  function getCellType(sId: string, hIdx: number): "extra-pre" | "extra-post" | "extra" | "pre" | "event" | "post" | "hover-pre" | "hover-event" | "hover-post" | null {
    if (selection && selection.salonId === sId && selection.dateStr === dateStr) {
      const cs = selection.coreStartIdx, ce = Math.min(cs + BLOCK_SIZE - 1, HOURS.length - 1)
      const fs = cs - selection.extrasBefore, fe = ce + selection.extrasAfter
      if (hIdx < fs || hIdx > fe) return null

      // Primera hora del rango completo = pre-montaje (extra+pre si hay extras, pre si no)
      if (hIdx === fs) return selection.extrasBefore > 0 ? "extra-pre" : "pre"
      // Última hora del rango completo = post-montaje (extra+post si hay extras, post si no)
      if (hIdx === fe) return selection.extrasAfter > 0 ? "extra-post" : "post"
      // Horas extra intermedias (entre extra-pre y el core, o entre core y extra-post)
      if (hIdx > fs && hIdx < cs) return "extra"
      if (hIdx > ce && hIdx < fe) return "extra"
      // Todo lo demás entre pre y post = evento (incluye old pre/post absorbidos)
      return "event"
    }
    if (hoverBlock && hoverBlock.salonId === sId) {
      const hs = hoverBlock.startIdx, he = Math.min(hs + BLOCK_SIZE - 1, HOURS.length - 1)
      if (hIdx === hs) return "hover-pre"; if (hIdx === he) return "hover-post"
      if (hIdx > hs && hIdx < he) return "hover-event"
    }
    return null
  }

  // Check if 8-block from startIdx fits (enough room and no reservacion in the individual clicked hour)
  function canSelectBlock(sId: string, startIdx: number): boolean {
    if (isPastDay) return false
    if (startIdx + BLOCK_SIZE - 1 >= HOURS.length) return false
    // Only block if the clicked hour itself has a reservacion
    if (hourHasRes(sId, dateStr, HOURS[startIdx].hour24)) return false
    return true
  }

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 min-w-[110px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {HOURS.map((h) => <th key={h.value} className="text-center p-1.5 font-medium text-blue-700 border-b border-r border-blue-100 min-w-[56px] whitespace-nowrap">{h.label}</th>)}
      </tr></thead>
      <tbody>
        {salones.map((salon) => (
          <tr key={salon.value} className="group hover:bg-blue-50/20">
            <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 truncate max-w-[130px]">{salon.text}</td>
            {HOURS.map((h, hIdx) => {
              const evts = getEventsForHourCell(salon.value, dateStr, h.hour24)
              const hasRes = hourHasRes(salon.value, dateStr, h.hour24)
              const primary = evts[0]
              const ct = getCellType(salon.value, hIdx)
              const isSalonSel = selection?.salonId === salon.value && selection?.dateStr === dateStr
              const canClick = canSelectBlock(salon.value, hIdx)

              const isLeftEdge = isSalonSel && hIdx === selFullStart
              const isRightEdge = isSalonSel && hIdx === selFullEnd

              let bg = "", bd = ""
              switch (ct) {
                case "pre": case "post": bg = "bg-purple-200"; bd = "border-purple-300"; break
                case "extra-pre": case "extra-post": bg = "bg-gradient-to-b from-teal-200 to-purple-200"; bd = "border-teal-400"; break
                case "event": bg = "bg-blue-200"; bd = "border-blue-300"; break
                case "extra": bg = "bg-teal-200"; bd = "border-teal-400"; break
                case "hover-pre": case "hover-post": bg = "bg-purple-100"; bd = "border-purple-200"; break
                case "hover-event": bg = "bg-blue-100"; bd = "border-blue-200"; break
              }

              return (
                <td key={h.value}
                  className={`border-b border-r border-blue-50 relative transition-colors h-[40px] select-none ${bg} ${bd} ${
                    ct
                      ? "cursor-pointer"
                      : isPastDay ? "bg-gray-50 cursor-not-allowed"
                      : hasRes ? "cursor-not-allowed"
                      : canClick ? "cursor-pointer hover:bg-blue-50/50"
                      : "cursor-not-allowed opacity-60"
                  }`}
                  onClick={() => {
                    // Allow clicking anywhere that's not past and not a reservacion hour
                    if (!isPastDay && !hasRes && (hIdx + BLOCK_SIZE - 1 < HOURS.length)) {
                      onHourClick(salon.value, dateStr, hIdx)
                    }
                  }}
                  onContextMenu={(e) => {
                    // Right-click clears selection
                    e.preventDefault()
                    if (ct) onClearSelection()
                  }}
                  onMouseEnter={() => {
                    if (dragging) { onDragMove(hIdx) }
                    else if (!isPastDay && !hasRes && !ct && (hIdx + BLOCK_SIZE - 1 < HOURS.length)) { setHoverBlock({ salonId: salon.value, startIdx: hIdx }) }
                  }}
                  onMouseLeave={() => { if (!dragging) setHoverBlock(null) }}
                  title={
                    ct === "extra-pre" ? "Hora extra + Pre-Montaje (clic derecho para quitar)"
                    : ct === "extra-post" ? "Hora extra + Post-Montaje (clic derecho para quitar)"
                    : ct === "extra" ? "Hora extra (clic derecho para quitar)"
                    : ct === "pre" || ct === "hover-pre" ? "Pre-Montaje (clic derecho para quitar)"
                    : ct === "post" || ct === "hover-post" ? "Post-Montaje (clic derecho para quitar)"
                    : ct === "event" || ct === "hover-event" ? "Evento (clic derecho para quitar)"
                    : primary ? `${primary.tipo === "reservacion" ? "RESERVACIÓN" : "COTIZACIÓN"}: ${primary.nombreevento}`
                    : "Disponible — clic para seleccionar"
                  }>

                  {/* Event bar when no selection on this cell */}
                  {primary && !ct && (
                    <div className={`absolute inset-0.5 rounded ${getEventBarColor(primary)} ${hasRes ? "opacity-80" : "opacity-40"}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[9px] font-bold truncate px-0.5 ${hasRes ? "text-white" : "text-amber-900"}`}>{primary.nombreevento?.slice(0, 6)}</span>
                      </div>
                    </div>
                  )}

                  {/* Labels */}
                  {(ct === "pre" || ct === "hover-pre") && !primary && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-purple-700">PRE</span></div>}
                  {(ct === "post" || ct === "hover-post") && !primary && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-purple-700">POST</span></div>}
                  {ct === "extra-pre" && <div className="absolute inset-0 flex flex-col items-center justify-center leading-none"><span className="text-[7px] font-bold text-teal-700">EXTRA</span><span className="text-[7px] font-bold text-purple-700">+PRE</span></div>}
                  {ct === "extra-post" && <div className="absolute inset-0 flex flex-col items-center justify-center leading-none"><span className="text-[7px] font-bold text-teal-700">EXTRA</span><span className="text-[7px] font-bold text-purple-700">+POST</span></div>}
                  {ct === "extra" && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] font-bold text-teal-700">EXTRA</span></div>}
                  {(ct === "event" || ct === "hover-event") && !primary && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-50" /></div>}

                  {/* LEFT drag handle */}
                  {isLeftEdge && (
                    <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-teal-400/30 rounded-l"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("left", hIdx) }}>
                      <div className="w-1 h-5 rounded-full bg-teal-600 group-hover/handle:bg-teal-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                    </div>
                  )}

                  {/* RIGHT drag handle */}
                  {isRightEdge && (
                    <div className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-teal-400/30 rounded-r"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("right", hIdx) }}>
                      <div className="w-1 h-5 rounded-full bg-teal-600 group-hover/handle:bg-teal-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                    </div>
                  )}
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
  Week View
================================================== */
function WeekView({ days, salones, getEventsForCell, onDayClick, isCellSel, isToday, isPast, hoveredCell, setHoveredCell }: {
  days: Date[]; salones: ddlItem[]; getEventsForCell: (s: string, d: string) => CalendarEvent[]
  onDayClick: (d: Date, s: string) => void; isCellSel: (s: string, d: string) => boolean
  isToday: (d: Date) => boolean; isPast: (d: Date) => boolean; hoveredCell: string | null; setHoveredCell: (v: string | null) => void
}) {
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 min-w-[110px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {days.map((d) => { const t = isToday(d); return <th key={toDateStr(d)} className={`text-center p-2 border-b border-r border-blue-100 min-w-[100px] ${t ? "bg-blue-600 text-white" : "text-blue-700"}`}><div className="text-[10px] uppercase tracking-wide">{DAYS_ES[d.getDay()]}</div><div className={`text-base font-bold ${t ? "text-white" : "text-blue-900"}`}>{d.getDate()}</div></th> })}
      </tr></thead>
      <tbody>{salones.map((s) => (
        <tr key={s.value} className="group">
          <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 truncate max-w-[130px]">{s.text}</td>
          {days.map((d) => {
            const ds = toDateStr(d), evts = getEventsForCell(s.value, ds), res = evts.filter(e => e.tipo === "reservacion"), cot = evts.filter(e => e.tipo === "cotizacion")
            const sel = isCellSel(s.value, ds), past = isPast(d), hov = hoveredCell === `${s.value}-${ds}`
            return <td key={ds} className={`border-b border-r border-blue-50 p-1 align-top min-h-[56px] h-[56px] transition-all ${past ? "bg-gray-50/80 cursor-not-allowed" : sel ? "bg-blue-100 ring-2 ring-inset ring-blue-500 cursor-pointer" : hov ? "bg-blue-50 cursor-pointer" : "cursor-pointer hover:bg-blue-50/50"}`}
              onClick={() => !past && onDayClick(d, s.value)} onMouseEnter={() => setHoveredCell(`${s.value}-${ds}`)} onMouseLeave={() => setHoveredCell(null)}>
              {res.slice(0, 2).map(r => <div key={`r-${r.id}`} className="rounded px-1.5 py-0.5 mb-0.5 border text-[10px] leading-tight truncate bg-red-100 border-red-300 text-red-800"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /><span className="font-semibold truncate">{r.nombreevento?.slice(0, 10)}</span></div><div className="text-[9px] text-red-600 opacity-70">{r.horainicio?.slice(0, 5)} – {r.horafin?.slice(0, 5)}</div></div>)}
              {res.length > 2 && <div className="text-[9px] text-red-500 pl-1">+{res.length - 2}</div>}
              {cot.slice(0, 2).map(c => <div key={`c-${c.id}`} className="rounded px-1.5 py-0.5 mb-0.5 border text-[10px] leading-tight truncate bg-amber-50 border-amber-200 text-amber-800"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" /><span className="font-semibold truncate">{c.nombreevento?.slice(0, 10)}</span></div><div className="text-[9px] text-amber-600 opacity-70">{c.horainicio?.slice(0, 5)} – {c.horafin?.slice(0, 5)}</div></div>)}
              {cot.length > 2 && <div className="text-[9px] text-amber-500 pl-1">+{cot.length - 2}</div>}
              {evts.length === 0 && !past && <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-30"><span className="text-[10px] text-blue-400">Disponible</span></div>}
            </td>
          })}
        </tr>
      ))}</tbody>
    </table>
  )
}

/* ==================================================
  Month View
================================================== */
function MonthView({ days, salones, getEventsForCell, onDayClick, isCellSel, isToday, isPast }: {
  days: (Date | null)[]; salones: ddlItem[]; getEventsForCell: (s: string, d: string) => CalendarEvent[]
  onDayClick: (d: Date, s: string) => void; isCellSel: (s: string, d: string) => boolean; isToday: (d: Date) => boolean; isPast: (d: Date) => boolean
}) {
  function getSummary(ds: string) { const r: { salon: ddlItem; res: CalendarEvent[]; cot: CalendarEvent[] }[] = []; for (const s of salones) { const e = getEventsForCell(s.value, ds); if (e.length > 0) r.push({ salon: s, res: e.filter(x => x.tipo === "reservacion"), cot: e.filter(x => x.tipo === "cotizacion") }) }; return r }
  return (
    <div className="p-2">
      <div className="grid grid-cols-7 gap-1 mb-1">{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => <div key={d} className="text-center text-[10px] font-bold text-blue-700 uppercase tracking-wide py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="min-h-[74px] rounded-lg bg-gray-50/50" />
          const ds = toDateStr(day), t = isToday(day), p = isPast(day), sum = getSummary(ds), anySel = salones.some(s => isCellSel(s.value, ds))
          return <div key={ds} className={`min-h-[74px] rounded-lg border p-1 transition-all ${t ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : anySel ? "border-blue-400 bg-blue-50" : p ? "border-gray-100 bg-gray-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"}`}
            onClick={() => !p && onDayClick(day, salones[0]?.value || "")}>
            <div className={`text-xs font-bold mb-0.5 ${t ? "text-blue-600" : p ? "text-gray-400" : "text-gray-700"}`}>{day.getDate()}</div>
            {sum.length > 0 ? <div className="space-y-0.5">
              {sum.slice(0, 3).map(({ salon, res, cot }) => <div key={salon.value} className={`rounded px-1 py-0.5 text-[9px] leading-tight truncate cursor-pointer border ${res.length > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
                onClick={e => { e.stopPropagation(); if (!p) onDayClick(day, salon.value) }}><div className="flex items-center gap-0.5"><div className={`w-1.5 h-1.5 rounded-full ${res.length > 0 ? "bg-red-500" : "bg-amber-400"}`} /><span className="font-semibold truncate">{salon.text.slice(0, 8)}</span></div></div>)}
              {sum.length > 3 && <div className="text-[8px] text-blue-500">+{sum.length - 3}</div>}
            </div> : !p ? <div className="h-full flex items-center justify-center"><span className="text-[9px] text-green-400 opacity-0 hover:opacity-100">Libre</span></div> : null}
          </div>
        })}
      </div>
    </div>
  )
}
