"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays, CalendarRange, ArrowLeft, GripVertical, User, Users, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { obtenerEventosPorHotel } from "@/app/actions/cotizaciones"
import type { ddlItem } from "@/types/common"

/* ==================================================
  Types
================================================== */
interface CalendarEvent {
  id: number; nombreevento: string; salonName: string; salonid: number
  fechainicio: string; fechafin: string; horainicio: string; horafin: string
  estatus: string; cliente: string; numeroinvitados: number
  tipo: "reservacion" | "cotizacion" | "draft"
}

export interface DraftReservacion {
  salonid: string | number
  fechainicio: string
  fechafin: string
  horainicio: string
  horafin: string
  horapremontaje?: string
  horapostmontaje?: string
  label?: string
}
type ViewMode = "day" | "week" | "month"

interface AvailabilityCalendarProps {
  hotelId: string; salones: ddlItem[]
  onSelectSlot: (fecha: string, salonId: string, horaPreMontaje?: string, horaInicio?: string, horaFin?: string, horaPostMontaje?: string, horasExtras?: number, fechaFin?: string, overlappingCotizacion?: string) => void
  selectedFechaInicio?: string; selectedFechaFin?: string; selectedSalonId?: string
  selectedHoraPreMontaje?: string; selectedHoraInicio?: string; selectedHoraFin?: string; selectedHoraPostMontaje?: string
  initialViewMode?: "day" | "week" | "month"
  initialDate?: string
  draftReservaciones?: DraftReservacion[]
  /** Combo que identifica la reservación en edición para excluirla del grid (se maneja como selection editable).
   *  vw_oeventos.id es el eventoid (compartido entre reservaciones del mismo evento), así que matcheamos
   *  por eventoid + salonid + fechainicio + horainicio del último guardado. */
  excludeMatch?: { eventoid?: number; salonid?: string | number; fechainicio?: string; horainicio?: string }
}

interface SelectionState {
  salonId: string; dateStr: string; coreStartIdx: number
  extrasBefore: number; extrasAfter: number
  preHours: number; postHours: number // horas de montaje dentro del rango (mínimo 1)
}

// Day range selection for week/month view
interface DaySelectionState {
  salonId: string
  startDate: string  // core selected day
  daysBefore: number // extra days before
  daysAfter: number  // extra days after
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
const BLOCK_SIZE = 6 // 1 pre + 4 event + 1 post
const MAX_EVENT_HOURS = 8
const CORE_EVENTS = BLOCK_SIZE - 2 // 4
const REMAINING_CAP = MAX_EVENT_HOURS - CORE_EVENTS // 4 slots adicionales de evento antes de extras
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
/** Hora de fin de un bloque: la hora siguiente. Ej: celda "16:00" (4PM-5PM) → fin = "17:00" */
function endOfBlock(idx: number): string {
  const hr = HOURS[idx].hour24
  const next = (hr + 1) % 24
  return `${next.toString().padStart(2, "0")}:00`
}
/** Índice de la celda que EMPIEZA en la hora dada (inverso de endOfBlock) */
function idxFromEndHour(v: string): number {
  const hr = parseInt(v.split(":")[0], 10)
  const prev = (hr - 1 + 24) % 24
  return HOURS.findIndex((h) => h.hour24 === prev)
}
function getEventBarColor(ev: CalendarEvent) { if (ev.tipo === "draft") return "bg-sky-300"; if (ev.tipo === "reservacion") { const e = ev.estatus?.toLowerCase() || ""; if (e.includes("cancel")) return "bg-gray-400"; return "bg-purple-900" } return "bg-amber-400" }

/** Total máximo de evento = 8 (core 4 + 4 de extensiones).
 *  Prioridad al lado más extendido: ese lado absorbe primero sus slots de evento.
 *  El lado menor recibe lo que queda. Extras siempre quedan de su lado. */
function calcSideExtras(leftExt: number, rightExt: number, totalExtras: number) {
  if (totalExtras <= 0) return { leftExtras: 0, rightExtras: 0 }
  // El lado más grande absorbe primero hasta REMAINING_CAP
  let la: number, ra: number
  if (leftExt >= rightExt) {
    la = Math.min(leftExt, REMAINING_CAP)
    ra = Math.min(rightExt, REMAINING_CAP - la)
  } else {
    ra = Math.min(rightExt, REMAINING_CAP)
    la = Math.min(leftExt, REMAINING_CAP - ra)
  }
  return { leftExtras: leftExt - la, rightExtras: rightExt - ra }
}

/** Total máximo de evento = 8 (core 4 + 4 de extensiones).
 *  Prioridad al lado más extendido: ese lado absorbe primero sus slots de evento.
 *  El lado menor recibe lo que queda. Extras siempre quedan de su lado. */
function calcSideExtras(leftExt: number, rightExt: number, totalExtras: number) {
  if (totalExtras <= 0) return { leftExtras: 0, rightExtras: 0 }
  // El lado más grande absorbe primero hasta REMAINING_CAP
  let la: number, ra: number
  if (leftExt >= rightExt) {
    la = Math.min(leftExt, REMAINING_CAP)
    ra = Math.min(rightExt, REMAINING_CAP - la)
  } else {
    ra = Math.min(rightExt, REMAINING_CAP)
    la = Math.min(leftExt, REMAINING_CAP - ra)
  }
  return { leftExtras: leftExt - la, rightExtras: rightExt - ra }
}

/* ==================================================
  Main Component
================================================== */
export function AvailabilityCalendar({
  hotelId, salones, onSelectSlot,
  selectedFechaInicio, selectedFechaFin, selectedSalonId,
  selectedHoraPreMontaje, selectedHoraInicio, selectedHoraFin, selectedHoraPostMontaje,
  initialViewMode, initialDate, draftReservaciones, excludeMatch,
}: AvailabilityCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "week")
  const [previousView, setPreviousView] = useState<ViewMode | null>(null)
  const [currentDate, setCurrentDate] = useState(() => {
    const seed = initialDate || selectedFechaInicio
    return seed ? new Date(seed + "T12:00:00") : new Date()
  })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [hoverBlock, setHoverBlock] = useState<{ salonId: string; startIdx: number } | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(() => {
    // Reconstruir selección visual a partir de props (al montar: útil al cambiar de tab de reservación)
    if (!selectedSalonId || !selectedFechaInicio || !selectedHoraInicio || !selectedHoraFin) return null
    const preRef = selectedHoraPreMontaje || selectedHoraInicio
    const postRef = selectedHoraPostMontaje || selectedHoraFin
    const fullStart = getHourIdx(preRef)
    const fullEnd = idxFromEndHour(postRef)
    const evtStart = getHourIdx(selectedHoraInicio)
    const evtEnd = idxFromEndHour(selectedHoraFin)
    if (fullStart < 0 || fullEnd < 0 || evtStart < 0 || evtEnd < 0) return null
    const preHours = Math.max(1, evtStart - fullStart)
    const postHours = Math.max(1, fullEnd - evtEnd)
    const coreStartIdx = fullStart
    const extrasAfter = Math.max(0, (fullEnd - fullStart + 1) - BLOCK_SIZE)
    return {
      salonId: selectedSalonId,
      dateStr: selectedFechaInicio.slice(0, 10),
      coreStartIdx,
      extrasBefore: 0,
      extrasAfter,
      preHours,
      postHours,
    }
  })
  const [overlapAlert, setOverlapAlert] = useState<string | null>(null)
  const [eventDetail, setEventDetail] = useState<CalendarEvent | null>(null)
  // Guardar las últimas horas emitidas por el calendario para detectar cambios del usuario vs del calendario
  const lastEmittedRef = useRef<{ horaInicio: string; horaFin: string } | null>(null)
  // Marca que la fecha emitida vino de un clic en vista semana; suprime el auto-switch a día.
  const weekClickEmittedFechaRef = useRef<string | null>(null)
  // Day range selection for week/month view
  const [daySel, setDaySel] = useState<DaySelectionState | null>(null)
  const [dayDragging, setDayDragging] = useState<"left" | "right" | null>(null)
  const dayDragStartRef = useRef<{ daysBefore: number; daysAfter: number; startDateStr: string } | null>(null)

  // Drag state: left/right = rango evento, pre/post = montaje dentro del rango
  const [dragging, setDragging] = useState<"left" | "right" | "pre" | "post" | null>(null)
  const dragStartRef = useRef<{ extrasBefore: number; extrasAfter: number; preHours: number; postHours: number; startMouseIdx: number } | null>(null)

  const salonNameMap = useMemo(() => { const m = new Map<string, string>(); for (const s of salones) m.set(s.value, s.text); return m }, [salones])

  const dateRange = useMemo(() => {
    if (viewMode === "day") return { start: new Date(currentDate), end: new Date(currentDate) }
    if (viewMode === "week") { const s = getWeekStart(currentDate); return { start: s, end: addDays(s, 6) } }
    // Month view: load full year
    return { start: new Date(currentDate.getFullYear(), 0, 1), end: new Date(currentDate.getFullYear(), 11, 31) }
  }, [viewMode, currentDate])

  const loadEvents = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    const result = await obtenerEventosPorHotel(Number(hotelId), toDateStr(dateRange.start), toDateStr(dateRange.end))
    const all: CalendarEvent[] = []
    if (result.success && result.data) {
      for (const e of result.data) {
        const tipo = String(e.tiporegistro).toLowerCase() === "reservacion" ? "reservacion" : "cotizacion"
        // Rango completo = desde pre-montaje hasta post-montaje (incluye horas extras extendidas en el rango)
        const horaIniFull = e.horapremontaje || e.horainicio || ""
        const horaFinFull = e.horapostmontaje || e.horafin || ""
        all.push({
          id: e.id,
          nombreevento: e.nombreevento || (tipo === "reservacion" ? "Reservación" : "Cotización"),
          salonName: e.salon || salonNameMap.get(String(e.salonid)) || "Salón",
          salonid: e.salonid,
          fechainicio: e.fechainicio,
          fechafin: e.fechafin,
          horainicio: horaIniFull,
          horafin: horaFinFull,
          estatus: e.estatus || "",
          cliente: e.cliente || "",
          numeroinvitados: e.numeroinvitados || 0,
          tipo,
        })
      }
    }
    setEvents(all); setLoading(false)
  }, [hotelId, dateRange, salonNameMap])

  useEffect(() => { loadEvents() }, [loadEvents])

  // Combinar eventos de DB con drafts in-memory (otras reservaciones del formulario actual)
  const displayEvents: CalendarEvent[] = useMemo(() => {
    // Excluir la reservación que se está editando — se maneja como selection editable, no como evento fijo.
    // Match por eventoid + salonid + fechainicio + horainicio (todos los provistos).
    const out = excludeMatch
      ? events.filter((e) => {
          if (excludeMatch.eventoid != null && Number(e.id) !== Number(excludeMatch.eventoid)) return true
          if (excludeMatch.salonid != null && Number(e.salonid) !== Number(excludeMatch.salonid)) return true
          if (excludeMatch.fechainicio && (e.fechainicio || "").slice(0, 10) !== excludeMatch.fechainicio.slice(0, 10)) return true
          if (excludeMatch.horainicio && (e.horainicio || "").slice(0, 5) !== excludeMatch.horainicio.slice(0, 5)) return true
          return false // todos los campos provistos coincidieron → excluir
        })
      : [...events]
    if (draftReservaciones && draftReservaciones.length > 0) {
      for (let i = 0; i < draftReservaciones.length; i++) {
        const d = draftReservaciones[i]
        if (!d.salonid || !d.fechainicio) continue
        out.push({
          id: -1000 - i,
          nombreevento: d.label || "Reservación (en captura)",
          salonName: salonNameMap.get(String(d.salonid)) || "Salón",
          salonid: Number(d.salonid),
          fechainicio: d.fechainicio,
          fechafin: d.fechafin || d.fechainicio,
          // Mostrar rango completo del draft: desde pre-montaje hasta post-montaje (incluye horas extras)
          horainicio: d.horapremontaje || d.horainicio || "",
          horafin: d.horapostmontaje || d.horafin || "",
          estatus: "Borrador",
          cliente: "",
          numeroinvitados: 0,
          tipo: "draft",
        })
      }
    }
    return out
  }, [events, draftReservaciones, salonNameMap, excludeMatch])

  // Cuando las props llegan tarde (ej: edición/switch de tab: formData se hidrata después del mount),
  // construir/reconstruir la selection desde props si:
  //  - aún no existe, O
  //  - el salon/fecha de la selection actual no coinciden con las props (tab nueva con otra reservación)
  useEffect(() => {
    if (!selectedSalonId || !selectedFechaInicio || !selectedHoraInicio || !selectedHoraFin) return
    const dateStrProp = selectedFechaInicio.slice(0, 10)
    if (selection && selection.salonId === selectedSalonId && selection.dateStr === dateStrProp) return
    const preRef = selectedHoraPreMontaje || selectedHoraInicio
    const postRef = selectedHoraPostMontaje || selectedHoraFin
    const fullStart = getHourIdx(preRef)
    const fullEnd = idxFromEndHour(postRef)
    const evtStart = getHourIdx(selectedHoraInicio)
    const evtEnd = idxFromEndHour(selectedHoraFin)
    if (fullStart < 0 || fullEnd < 0 || evtStart < 0 || evtEnd < 0) return
    const preHours = Math.max(1, evtStart - fullStart)
    const postHours = Math.max(1, fullEnd - evtEnd)
    const coreStartIdx = fullStart
    const extrasAfter = Math.max(0, (fullEnd - fullStart + 1) - BLOCK_SIZE)
    setSelection({
      salonId: selectedSalonId,
      dateStr: selectedFechaInicio.slice(0, 10),
      coreStartIdx,
      extrasBefore: 0,
      extrasAfter,
      preHours,
      postHours,
    })
  }, [selection, selectedSalonId, selectedFechaInicio, selectedHoraInicio, selectedHoraFin, selectedHoraPreMontaje, selectedHoraPostMontaje])

  // Al cambiar la fecha de la reservación (tab switch), sincronizar currentDate y mostrar vista día.
  // Solo auto-conmuta a día cuando además hay horas (reservación ya guardada); si solo viene fecha
  // (ej: clic de rango en vista semana) nos mantenemos en la vista actual para permitir extender el rango.
  useEffect(() => {
    if (!selectedFechaInicio) return
    const fechaStr = selectedFechaInicio.slice(0, 10)
    // Si la fecha que llega proviene del clic de semana que acabamos de emitir, no auto-conmutar a día.
    const fromWeekClick = weekClickEmittedFechaRef.current === fechaStr
    if (fromWeekClick) {
      weekClickEmittedFechaRef.current = null
      return
    }
    const target = new Date(selectedFechaInicio + "T12:00:00")
    if (target.getTime() !== currentDate.getTime()) {
      setCurrentDate(target)
    }
    if (selectedHoraInicio && viewMode !== "day") setViewMode("day")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFechaInicio, selectedHoraInicio])

  // Inicializar daySel (rango de la vista semana) cuando hay fecha+salón asignados a la reservación
  // Así al editar o al volver a semana, el rango del día(s) queda resaltado.
  useEffect(() => {
    if (!selectedFechaInicio || !selectedSalonId) { setDaySel(null); return }
    const fi = selectedFechaInicio.slice(0, 10)
    const ff = (selectedFechaFin || selectedFechaInicio).slice(0, 10)
    const fiDate = new Date(fi + "T12:00:00")
    const ffDate = new Date(ff + "T12:00:00")
    const daysAfter = Math.max(0, Math.round((ffDate.getTime() - fiDate.getTime()) / 86400000))
    setDaySel({ salonId: String(selectedSalonId), startDate: fi, daysBefore: 0, daysAfter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFechaInicio, selectedFechaFin, selectedSalonId])

  // Sincronizar selection cuando los inputs de hora del formulario cambian
  // selectedHoraInicio/Fin = horas de EVENTO (primera y última hora de evento, no pre/post)
  useEffect(() => {
    if (!selection || !selectedSalonId || !selectedHoraInicio || !selectedHoraFin) return
    if (selection.salonId !== selectedSalonId) return
    // Si las horas coinciden con lo que el calendario emitió, el cambio vino del calendario → ignorar
    if (lastEmittedRef.current && lastEmittedRef.current.horaInicio === selectedHoraInicio && lastEmittedRef.current.horaFin === selectedHoraFin) return

    const newEvtStartIdx = getHourIdx(selectedHoraInicio)
    let newEvtEndIdx = idxFromEndHour(selectedHoraFin)
    if (newEvtStartIdx < 0 || newEvtEndIdx < 0) return

    const preH = selection.preHours ?? 1
    const postH = selection.postHours ?? 1

    // Si el rango de evento es menor a 4 horas, extender el fin para mantener mínimo 4
    if (newEvtEndIdx - newEvtStartIdx + 1 < CORE_EVENTS) {
      newEvtEndIdx = newEvtStartIdx + CORE_EVENTS - 1
    }

    // Rango completo = PRE + evento + POST
    const newFullStart = newEvtStartIdx - preH
    const newFullEnd = newEvtEndIdx + postH
    if (newFullStart < 0 || newFullEnd >= HOURS.length) return

    // Comparar con rango actual de evento
    const coreEnd = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const curFullStart = selection.coreStartIdx - selection.extrasBefore
    const curFullEnd = coreEnd + selection.extrasAfter
    const curEvtStart = curFullStart + preH
    const curEvtEnd = curFullEnd - postH
    if (curEvtStart === newEvtStartIdx && curEvtEnd === newEvtEndIdx) return

    // Recalcular: extrasBefore/After son respecto al core dentro del rango completo
    // fullStart = coreStartIdx - extrasBefore, fullEnd = coreEnd + extrasAfter
    // Necesitamos: newFullStart = newCore - newBefore, newFullEnd = newCoreEnd + newAfter
    const newCore = Math.max(newFullStart, Math.min(selection.coreStartIdx, newFullEnd - BLOCK_SIZE + 1))
    const newCoreEnd = Math.min(newCore + BLOCK_SIZE - 1, HOURS.length - 1)
    const newBefore = newCore - newFullStart
    const newAfter = newFullEnd - newCoreEnd

    const newSel: SelectionState = {
      ...selection,
      coreStartIdx: newCore,
      extrasBefore: newBefore,
      extrasAfter: newAfter,
    }
    setSelection(newSel)
    emitSelection(newSel)
  }, [selectedHoraInicio, selectedHoraFin])

  function goToDayView(date: Date, from: ViewMode) { setPreviousView(from); setCurrentDate(date); setViewMode("day") }
  function goBack() { if (previousView) { setViewMode(previousView); setPreviousView(null) } }
  function navigate(dir: -1 | 1) { setCurrentDate((p) => { const d = new Date(p); if (viewMode === "day") d.setDate(d.getDate() + dir); else if (viewMode === "week") d.setDate(d.getDate() + dir * 7); else d.setFullYear(d.getFullYear() + dir); return d }) }

  function getEventsForCell(sId: string, ds: string) { return displayEvents.filter((e) => e.salonid === Number(sId) && e.fechainicio <= ds && e.fechafin >= ds) }
  function getEventsForHourCell(sId: string, ds: string, hr: number) {
    return displayEvents.filter((e) => { if (e.salonid !== Number(sId) || e.fechainicio > ds || e.fechafin < ds) return false; const s = parseHour(e.horainicio), en = parseHour(e.horafin); if (s < 0 || en < 0) return true; return s <= en ? (hr >= s && hr < en) : (hr >= s || hr < en) })
  }
  function cellHasRes(sId: string, ds: string) { return displayEvents.some((e) => (e.tipo === "reservacion" || e.tipo === "draft") && e.salonid === Number(sId) && e.fechainicio <= ds && e.fechafin >= ds) }
  function hourHasRes(sId: string, ds: string, hr: number) { return getEventsForHourCell(sId, ds, hr).some((e) => e.tipo === "reservacion" || e.tipo === "draft") }
  function isCellSel(sId: string, ds: string) { if (!selectedSalonId || !selectedFechaInicio || sId !== selectedSalonId) return false; return selectedFechaFin ? (ds >= selectedFechaInicio && ds <= selectedFechaFin) : ds === selectedFechaInicio }
  function blockHasRes(sId: string, ds: string, start: number) { for (let i = start; i < start + BLOCK_SIZE && i < HOURS.length; i++) if (hourHasRes(sId, ds, HOURS[i].hour24)) return true; return false }

  function emitSelection(sel: SelectionState) {
    const coreEnd = Math.min(sel.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const fullStart = Math.max(sel.coreStartIdx - sel.extrasBefore, 0)
    const fullEnd = Math.min(coreEnd + sel.extrasAfter, HOURS.length - 1)

    // Detectar solapamiento con cotizaciones existentes
    // Usar índices del array HOURS en vez de hour24 para evitar problemas al cruzar medianoche
    const dateCheck = sel.dateStr.slice(0, 10)
    const overlapping = displayEvents.filter((e) => {
      if (e.tipo !== "cotizacion") return false
      if (e.salonid !== Number(sel.salonId)) return false
      const eFechaIni = (e.fechainicio || "").slice(0, 10)
      const eFechaFin = (e.fechafin || "").slice(0, 10)
      if (eFechaIni > dateCheck || eFechaFin < dateCheck) return false
      const eStartH = parseHour(e.horainicio)
      const eEndH = parseHour(e.horafin)
      if (eStartH < 0 || eEndH < 0) return true
      // Convertir a índices de HOURS para comparar linealmente
      const eStartIdx = HOURS.findIndex(h => h.hour24 === eStartH)
      const eEndIdx = HOURS.findIndex(h => h.hour24 === eEndH)
      if (eStartIdx < 0 || eEndIdx < 0) return true
      // Overlap: rangos [fullStart, fullEnd] y [eStartIdx, eEndIdx) se intersectan
      return fullStart <= eEndIdx && fullEnd >= eStartIdx
    })
    const overlapMsg = overlapping.length > 0
      ? `Empalme con cotización: ${overlapping.map(o => o.nombreevento).join(", ")}`
      : undefined
    setOverlapAlert(overlapMsg || null)

    // Extras: prioridad al lado más extendido
    const rawInner = fullEnd - fullStart - 1
    const rawTotalExtras = Math.max(0, rawInner - MAX_EVENT_HOURS)
    const { leftExtras, rightExtras } = calcSideExtras(Math.max(0, sel.extrasBefore), Math.max(0, sel.extrasAfter), rawTotalExtras)
    const extraHours = leftExtras + rightExtras

    // Pre/Post montaje en los extremos, horaInicio/Fin = primera/última celda de evento
    const preH = sel.preHours ?? 1
    const postH = sel.postHours ?? 1
    const evtStartIdx = fullStart + preH
    const evtEndIdx = fullEnd - postH

    const emitHoraInicio = HOURS[Math.min(evtStartIdx, HOURS.length - 1)].value
    const emitHoraFin = endOfBlock(Math.max(evtEndIdx, 0))
    lastEmittedRef.current = { horaInicio: emitHoraInicio, horaFin: emitHoraFin }

    onSelectSlot("", sel.salonId,
      HOURS[fullStart].value,                                        // horaPreMontaje (inicio del bloque pre)
      emitHoraInicio,                                                // horaInicio (inicio primera hora evento)
      emitHoraFin,                                                   // horaFin (fin de la última hora evento)
      endOfBlock(fullEnd),                                           // horaPostMontaje (fin del bloque post)
      extraHours,
      undefined,
      overlapMsg,
    )
  }

  function handleHourClick(sId: string, ds: string, idx: number) {
    const sel: SelectionState = { salonId: sId, dateStr: ds, coreStartIdx: idx, extrasBefore: 0, extrasAfter: 0, preHours: 1, postHours: 1 }
    setSelection(sel); emitSelection(sel)
  }

  // Drag handlers for edge handles
  function startDrag(side: "left" | "right" | "pre" | "post", mouseHourIdx: number) {
    if (!selection) return
    setDragging(side)
    dragStartRef.current = { extrasBefore: selection.extrasBefore, extrasAfter: selection.extrasAfter, preHours: selection.preHours, postHours: selection.postHours, startMouseIdx: mouseHourIdx }
  }

  function onDragMove(hoverIdx: number) {
    if (!dragging || !selection || !dragStartRef.current) return
    const { startMouseIdx, extrasBefore: origBefore, extrasAfter: origAfter } = dragStartRef.current
    const delta = hoverIdx - startMouseIdx
    const coreEnd = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const MIN_TOTAL = BLOCK_SIZE // PRE + 4 eventos + POST mínimo

    if (dragging === "pre") {
      // Arrastrar ▶ de PRE hacia la derecha = más pre, hacia izquierda = menos pre
      const newPre = Math.max(1, Math.min(MAX_PRE_POST, (dragStartRef.current.preHours) + delta))
      const fs = selection.coreStartIdx - selection.extrasBefore
      const fe = coreEnd + selection.extrasAfter
      const totalCells = fe - fs + 1
      if (totalCells - newPre - selection.postHours < MIN_EVENT_INNER) return
      const newSel = { ...selection, preHours: newPre }
      setSelection(newSel); emitSelection(newSel)
    } else if (dragging === "post") {
      const newPost = Math.max(1, Math.min(MAX_PRE_POST, (dragStartRef.current.postHours) - delta))
      const fs = selection.coreStartIdx - selection.extrasBefore
      const fe = coreEnd + selection.extrasAfter
      const totalCells = fe - fs + 1
      if (totalCells - selection.preHours - newPost < MIN_EVENT_INNER) return
      const newSel = { ...selection, postHours: newPost }
      setSelection(newSel); emitSelection(newSel)
    } else if (dragging === "left") {
      const newBefore = origBefore - delta
      const minBefore = MIN_TOTAL - BLOCK_SIZE - selection.extrasAfter
      const clampedBefore = Math.max(minBefore, newBefore)
      const newStartIdx = selection.coreStartIdx - clampedBefore
      if (newStartIdx < 0 || newStartIdx >= HOURS.length) return
      if (clampedBefore > 0) {
        for (let i = newStartIdx; i < selection.coreStartIdx; i++) {
          if (hourHasRes(selection.salonId, selection.dateStr, HOURS[i].hour24)) return
        }
      }
      const newSel = { ...selection, extrasBefore: clampedBefore }
      setSelection(newSel); emitSelection(newSel)
    } else {
      const newAfter = origAfter + delta
      const minAfter = MIN_TOTAL - BLOCK_SIZE - selection.extrasBefore
      const clampedAfter = Math.max(minAfter, newAfter)
      const newEndIdx = coreEnd + clampedAfter
      if (newEndIdx < 0 || newEndIdx >= HOURS.length) return
      if (clampedAfter > 0) {
        for (let i = coreEnd + 1; i <= newEndIdx; i++) {
          if (hourHasRes(selection.salonId, selection.dateStr, HOURS[i].hour24)) return
        }
      }
      const newSel = { ...selection, extrasAfter: clampedAfter }
      setSelection(newSel); emitSelection(newSel)
    }
  }

  function endDrag() { setDragging(null); dragStartRef.current = null }

  // Ajustar pre/post montaje dentro del rango (máx 3 hrs c/u, no cubrir las 4 hrs fijas de evento)
  const MAX_PRE_POST = 3
  const MIN_EVENT_INNER = CORE_EVENTS // 4 horas de evento siempre protegidas

  function adjustPre(delta: number) {
    if (!selection) return
    const newPre = Math.max(1, Math.min(MAX_PRE_POST, (selection.preHours ?? 1) + delta))
    const ce = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const fs = selection.coreStartIdx - selection.extrasBefore
    const fe = ce + selection.extrasAfter
    const totalCells = fe - fs + 1
    const postH = selection.postHours ?? 1
    if (totalCells - newPre - postH < MIN_EVENT_INNER) return
    const newSel = { ...selection, preHours: newPre }
    setSelection(newSel); emitSelection(newSel)
  }

  function adjustPost(delta: number) {
    if (!selection) return
    const newPost = Math.max(1, Math.min(MAX_PRE_POST, (selection.postHours ?? 1) + delta))
    const ce = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
    const fs = selection.coreStartIdx - selection.extrasBefore
    const fe = ce + selection.extrasAfter
    const totalCells = fe - fs + 1
    const preH = selection.preHours ?? 1
    if (totalCells - preH - newPost < MIN_EVENT_INNER) return
    const newSel = { ...selection, postHours: newPost }
    setSelection(newSel); emitSelection(newSel)
  }

  // === Day range selection (week view) ===
  function emitDaySel(ds: DaySelectionState) {
    const startD = addDays(new Date(ds.startDate + "T12:00:00"), -ds.daysBefore)
    const endD = addDays(new Date(ds.startDate + "T12:00:00"), ds.daysAfter)
    const fechaIni = toDateStr(startD)
    const fechaFin = toDateStr(endD)
    weekClickEmittedFechaRef.current = fechaIni
    onSelectSlot(fechaIni, ds.salonId, undefined, undefined, undefined, undefined, undefined, fechaFin)
  }

  function handleDayClick(date: Date, salonId: string) {
    const ds: DaySelectionState = { salonId, startDate: toDateStr(date), daysBefore: 0, daysAfter: 0 }
    setDaySel(ds)
    emitDaySel(ds)
  }

  function handleDayRangeClick() {
    // Click on selected range → go to day view
    if (!daySel) return
    const startD = addDays(new Date(daySel.startDate + "T12:00:00"), -daySel.daysBefore)
    goToDayView(startD, viewMode as "week" | "month")
  }

  function startDayDrag(side: "left" | "right", dateStr: string) {
    if (!daySel) return
    setDayDragging(side)
    dayDragStartRef.current = { daysBefore: daySel.daysBefore, daysAfter: daySel.daysAfter, startDateStr: dateStr }
  }

  function daysDiff(a: string, b: string): number {
    return Math.round((new Date(a + "T12:00:00").getTime() - new Date(b + "T12:00:00").getTime()) / 86400000)
  }

  function onDayDragMove(hoverDateStr: string) {
    if (!dayDragging || !daySel || !dayDragStartRef.current) return
    const { startDateStr, daysBefore: origBefore, daysAfter: origAfter } = dayDragStartRef.current
    const delta = daysDiff(hoverDateStr, startDateStr)
    if (dayDragging === "left") {
      const newExtras = Math.max(0, origBefore - delta)
      const newSel = { ...daySel, daysBefore: newExtras }
      setDaySel(newSel); emitDaySel(newSel)
    } else {
      const newExtras = Math.max(0, origAfter + delta)
      const newSel = { ...daySel, daysAfter: newExtras }
      setDaySel(newSel); emitDaySel(newSel)
    }
  }

  function endDayDrag() { setDayDragging(null); dayDragStartRef.current = null }

  const title = useMemo(() => {
    if (viewMode === "day") { const d = currentDate; return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}` }
    if (viewMode === "week") { const s = dateRange.start, e = dateRange.end; return s.getMonth() === e.getMonth() ? `${s.getDate()} – ${e.getDate()} de ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}` : `${s.getDate()} ${MONTHS_ES[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_ES[e.getMonth()].slice(0, 3)} ${e.getFullYear()}` }
    return `${currentDate.getFullYear()}`
  }, [viewMode, currentDate, dateRange])
  const weekDays = useMemo(() => { const d: Date[] = [], s = getWeekStart(currentDate); for (let i = 0; i < 7; i++) d.push(addDays(s, i)); return d }, [currentDate])
  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date())
  const isPast = (d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))

  if (!hotelId) return <div className="border border-blue-100 rounded-lg bg-blue-50/30 p-8 text-center"><Calendar className="w-10 h-10 text-blue-200 mx-auto mb-2" /><p className="text-sm text-blue-400">Selecciona un hotel para ver la disponibilidad</p></div>
  if (salones.length === 0) return <div className="border border-blue-100 rounded-lg bg-blue-50/30 p-8 text-center"><Calendar className="w-10 h-10 text-blue-200 mx-auto mb-2" /><p className="text-sm text-blue-400">Cargando salones...</p></div>

  return (
    <div className="border border-blue-200 rounded-xl bg-white overflow-hidden shadow-sm"
      onMouseUp={() => { endDrag(); endDayDrag() }} onMouseLeave={() => { endDrag(); endDayDrag() }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          {viewMode === "day" && previousView && <button type="button" onClick={goBack} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md px-2 py-1 mr-1"><ArrowLeft className="w-3.5 h-3.5" /> Volver</button>}
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900">{title}</h3>
          {loading && <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
          {viewMode === "day" && selection && (() => {
            const ce = Math.min(selection.coreStartIdx + BLOCK_SIZE - 1, HOURS.length - 1)
            const fs = selection.coreStartIdx - selection.extrasBefore
            const fe = ce + selection.extrasAfter
            const preH = selection.preHours ?? 1, postH = selection.postHours ?? 1
            const totalInner = fe - fs + 1 - preH - postH
            const rawInner = fe - fs - 1
            const extraHrs = Math.max(0, rawInner - MAX_EVENT_HOURS)
            const eventHrs = Math.min(MAX_EVENT_HOURS, Math.max(0, rawInner))
            return (
              <>
                {preH > 1 && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full ml-2">
                    {preH} hrs pre
                  </span>
                )}
                {eventHrs > CORE_EVENTS && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full ml-1">
                    {eventHrs} hrs evento
                  </span>
                )}
                {extraHrs > 0 && (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full ml-1">
                    +{extraHrs} hr extra{extraHrs !== 1 ? "s" : ""}
                  </span>
                )}
                {postH > 1 && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full ml-1">
                    {postH} hrs post
                  </span>
                )}
              </>
            )
          })()}
          {overlapAlert && (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-300 rounded-full px-2.5 py-0.5 ml-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <span className="text-[10px] font-bold text-orange-800">{overlapAlert}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {viewMode === "day" && !selection && <span className="text-[10px] text-gray-400 mr-2">Clic en una hora para bloque de 8 hrs</span>}
          {viewMode === "day" && selection && <span className="text-[10px] text-gray-400 mr-2">Arrastra ◀ ▶ para extender el rango</span>}
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
      <div className="overflow-y-auto overflow-x-hidden max-h-[420px]">
        {viewMode === "day" && <DayView date={currentDate} salones={salones} getEventsForHourCell={getEventsForHourCell} hourHasRes={hourHasRes} onHourClick={handleHourClick} hoverBlock={hoverBlock} setHoverBlock={setHoverBlock} selection={selection} dragging={dragging} startDrag={startDrag} onDragMove={onDragMove} onClearSelection={() => { setSelection(null); setOverlapAlert(null); lastEmittedRef.current = null; onSelectSlot("", "", "", "", "", "", 0) }} onAdjustPre={adjustPre} onAdjustPost={adjustPost} onEventClick={setEventDetail} />}
        {viewMode === "week" && <WeekView days={weekDays} salones={salones} getEventsForCell={getEventsForCell}
          onDayClick={handleDayClick}
          onRangeClick={handleDayRangeClick}
          daySel={daySel}
          dayDragging={dayDragging}
          startDayDrag={startDayDrag}
          onDayDragMove={onDayDragMove}
          onClearDaySel={() => setDaySel(null)}
          isCellSel={isCellSel} isToday={isToday} isPast={isPast} hoveredCell={hoveredCell} setHoveredCell={setHoveredCell} onEventClick={setEventDetail} />}
        {viewMode === "month" && <MonthView
          year={currentDate.getFullYear()}
          salones={salones}
          events={displayEvents}
          onMonthClick={(month) => {
            const now = new Date()
            const yr = currentDate.getFullYear()
            // Si es el mes actual del año actual, ir a la semana actual
            if (yr === now.getFullYear() && month === now.getMonth()) {
              setCurrentDate(now)
            } else {
              setCurrentDate(new Date(yr, month, 1))
            }
            setViewMode("week")
            setPreviousView("month")
          }}
        />}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-blue-100 bg-gray-50/50 flex-wrap">
        <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Leyenda:</span>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-purple-900" /><span className="text-[10px] text-gray-600">Reservación</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[10px] text-gray-600">Cotización</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-purple-300 border border-purple-400" /><span className="text-[10px] text-gray-600">Montaje</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-200 border border-blue-400" /><span className="text-[10px] text-gray-600">Evento</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-teal-300 border border-teal-500" /><span className="text-[10px] text-gray-600">Hora extra</span></div>
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal event={eventDetail} onClose={() => setEventDetail(null)} />
    </div>
  )
}

/* ==================================================
  Day View — with drag handles at range edges
================================================== */
function DayView({ date, salones, getEventsForHourCell, hourHasRes, onHourClick, hoverBlock, setHoverBlock, selection, dragging, startDrag, onDragMove, onClearSelection, onAdjustPre, onAdjustPost, onEventClick }: {
  date: Date; salones: ddlItem[]
  getEventsForHourCell: (s: string, d: string, h: number) => CalendarEvent[]
  hourHasRes: (s: string, d: string, h: number) => boolean
  onHourClick: (s: string, d: string, i: number) => void
  hoverBlock: { salonId: string; startIdx: number } | null
  setHoverBlock: (v: { salonId: string; startIdx: number } | null) => void
  selection: SelectionState | null
  dragging: "left" | "right" | "pre" | "post" | null
  startDrag: (side: "left" | "right" | "pre" | "post", mouseIdx: number) => void
  onDragMove: (hoverIdx: number) => void
  onClearSelection: () => void
  onAdjustPre: (delta: number) => void
  onAdjustPost: (delta: number) => void
  onEventClick: (ev: CalendarEvent) => void
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

      const preH = selection.preHours ?? 1, postH = selection.postHours ?? 1

      // Calcular extras con prioridad al lado más extendido
      const leftExt = Math.max(0, selection.extrasBefore)
      const rightExt = Math.max(0, selection.extrasAfter)
      const rawInner = fe - fs - 1 // celdas internas con pre=1, post=1
      const rawTotalExtras = Math.max(0, rawInner - MAX_EVENT_HOURS)
      const { leftExtras: rawLE, rightExtras: rawRE } = calcSideExtras(leftExt, rightExt, rawTotalExtras)

      // Posiciones absolutas de extras: izq pegadas a fs+1, der pegadas a fe-1
      const isExtraPos = (idx: number) => {
        const pLeft = idx - fs        // 1-based desde fs
        const pRight = fe - idx       // 1-based desde fe
        if (rawLE > 0 && pLeft >= 1 && pLeft <= rawLE) return true
        if (rawRE > 0 && pRight >= 1 && pRight <= rawRE) return true
        return false
      }

      // Bloque PRE
      if (hIdx < fs + preH) return isExtraPos(hIdx) ? "extra-pre" : "pre"
      // Bloque POST
      if (hIdx > fe - postH) return isExtraPos(hIdx) ? "extra-post" : "post"

      // Celdas internas entre bloques PRE y POST
      const innerStart = fs + preH
      const innerEnd = fe - postH
      const totalInner = innerEnd - innerStart + 1
      if (totalInner <= MAX_EVENT_HOURS) return "event"

      // Extras en zona interna
      const posFromLeft = hIdx - fs
      const posFromRight = fe - hIdx
      if (rawLE > 0 && posFromLeft >= 1 && posFromLeft <= rawLE) return "extra"
      if (rawRE > 0 && posFromRight >= 1 && posFromRight <= rawRE) return "extra"
      return "event"
    }
    if (hoverBlock && hoverBlock.salonId === sId) {
      const hs = hoverBlock.startIdx, he = Math.min(hs + BLOCK_SIZE - 1, HOURS.length - 1)
      if (hIdx === hs) return "hover-pre"; if (hIdx === he) return "hover-post"
      if (hIdx > hs && hIdx < he) return "hover-event"
    }
    return null
  }

  // Determine if this cell is start/middle/end of an event span for connected rendering
  function getEventSpanPos(ev: CalendarEvent, hour: number): "start" | "middle" | "end" | "single" {
    const eStart = parseHour(ev.horainicio)
    const eEnd = parseHour(ev.horafin)
    if (eStart < 0 || eEnd < 0) return "middle"
    const lastHour = eEnd > 0 ? eEnd - 1 : eEnd // last occupied hour
    if (eStart === lastHour) return "single"
    if (hour === eStart) return "start"
    if (hour === lastHour) return "end"
    return "middle"
  }

  // Check if 8-block from startIdx fits
  function canSelectBlock(sId: string, startIdx: number): boolean {
    if (isPastDay) return false
    if (startIdx + BLOCK_SIZE - 1 >= HOURS.length) return false
    // Only block if the clicked hour itself has a reservacion
    if (hourHasRes(sId, dateStr, HOURS[startIdx].hour24)) return false
    return true
  }

  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[100px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {HOURS.map((h) => <th key={h.value} className="text-center p-1 font-medium text-blue-700 border-b border-r border-blue-100 whitespace-nowrap text-[10px]">{h.label}</th>)}
      </tr></thead>
      <tbody>
        {salones.map((salon) => (
          <tr key={salon.value} className="group hover:bg-blue-50/20">
            <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 truncate w-[100px]">{salon.text}</td>
            {HOURS.map((h, hIdx) => {
              const evts = getEventsForHourCell(salon.value, dateStr, h.hour24)
              const hasRes = hourHasRes(salon.value, dateStr, h.hour24)
              const primary = evts[0]
              const ct = getCellType(salon.value, hIdx)
              const isSalonSel = selection?.salonId === salon.value && selection?.dateStr === dateStr
              const canClick = canSelectBlock(salon.value, hIdx)

              const isLeftEdge = isSalonSel && hIdx === selFullStart
              const isRightEdge = isSalonSel && hIdx === selFullEnd
              // Bordes interiores de PRE y POST para flechas de extensión de montaje
              const preH = selection?.preHours ?? 1
              const postH = selection?.postHours ?? 1
              const isPreInnerEdge = isSalonSel && (ct === "pre" || ct === "extra-pre") && hIdx === selFullStart + preH - 1
              const isPostInnerEdge = isSalonSel && (ct === "post" || ct === "extra-post") && hIdx === selFullEnd - postH + 1

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
                    ct === "extra-pre" ? "Hora extra + Pre-Montaje"
                    : ct === "extra-post" ? "Hora extra + Post-Montaje"
                    : ct === "extra" ? "Hora extra (clic derecho para quitar)"
                    : ct === "pre" || ct === "hover-pre" ? "Pre-Montaje (clic derecho para quitar)"
                    : ct === "post" || ct === "hover-post" ? "Post-Montaje (clic derecho para quitar)"
                    : ct === "event" || ct === "hover-event" ? "Evento (clic derecho para quitar)"
                    : primary ? `${primary.tipo === "reservacion" ? "RESERVACIÓN" : "COTIZACIÓN"}: ${primary.nombreevento}`
                    : "Disponible — clic para seleccionar"
                  }>

                  {/* Event bar — connected span rendering */}
                  {primary && !ct && (() => {
                    const pos = getEventSpanPos(primary, h.hour24)
                    const roundL = pos === "start" || pos === "single" ? "rounded-l" : ""
                    const roundR = pos === "end" || pos === "single" ? "rounded-r" : ""
                    const insetL = pos === "start" || pos === "single" ? "left-0.5" : "left-0"
                    const insetR = pos === "end" || pos === "single" ? "right-0.5" : "right-0"
                    const showLabel = pos === "start" || pos === "single"
                    return (
                      <div className={`absolute top-1 bottom-1 ${insetL} ${insetR} ${roundL} ${roundR} ${getEventBarColor(primary)} ${hasRes ? "opacity-85" : "opacity-50"} cursor-pointer hover:opacity-100 transition-opacity`}
                        onClick={(e) => { e.stopPropagation(); onEventClick(primary) }}>
                        {showLabel && (
                          <div className="absolute inset-0 flex items-center pl-1.5">
                            <span className={`text-[9px] font-bold truncate ${hasRes ? "text-white" : "text-amber-900"}`}>{primary.nombreevento?.slice(0, 12)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Labels + handles arrastrables de montaje */}
                  {(ct === "pre" || ct === "hover-pre") && !primary && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-purple-700">PRE</span>
                      {isPreInnerEdge && ct === "pre" && (
                        <div className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-purple-400/30 rounded-r"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("pre", hIdx) }}>
                          <div className="w-1 h-5 rounded-full bg-purple-600 group-hover/handle:bg-purple-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                        </div>
                      )}
                    </div>
                  )}
                  {ct === "extra-pre" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-[7px] font-bold text-teal-700">EXTRA</span>
                      <span className="text-[7px] font-bold text-purple-700">+PRE</span>
                      {isPreInnerEdge && (
                        <div className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-purple-400/30 rounded-r"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("pre", hIdx) }}>
                          <div className="w-1 h-5 rounded-full bg-purple-600 group-hover/handle:bg-purple-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                        </div>
                      )}
                    </div>
                  )}
                  {(ct === "post" || ct === "hover-post") && !primary && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isPostInnerEdge && ct === "post" && (
                        <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-purple-400/30 rounded-l"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("post", hIdx) }}>
                          <div className="w-1 h-5 rounded-full bg-purple-600 group-hover/handle:bg-purple-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                        </div>
                      )}
                      <span className="text-[8px] font-bold text-purple-700">POST</span>
                    </div>
                  )}
                  {ct === "extra-post" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      {isPostInnerEdge && (
                        <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-purple-400/30 rounded-l"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag("post", hIdx) }}>
                          <div className="w-1 h-5 rounded-full bg-purple-600 group-hover/handle:bg-purple-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                        </div>
                      )}
                      <span className="text-[7px] font-bold text-teal-700">EXTRA</span>
                      <span className="text-[7px] font-bold text-purple-700">+POST</span>
                    </div>
                  )}
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
  Week View — with day range selection + drag handles
================================================== */
function WeekView({ days, salones, getEventsForCell, onDayClick, onRangeClick, daySel, dayDragging, startDayDrag, onDayDragMove, onClearDaySel, isCellSel, isToday, isPast, hoveredCell, setHoveredCell, onEventClick }: {
  days: Date[]; salones: ddlItem[]; getEventsForCell: (s: string, d: string) => CalendarEvent[]
  onDayClick: (d: Date, s: string) => void
  onRangeClick: () => void
  daySel: DaySelectionState | null
  dayDragging: "left" | "right" | null
  startDayDrag: (side: "left" | "right", dateStr: string) => void
  onDayDragMove: (dateStr: string) => void
  onClearDaySel: () => void
  isCellSel: (s: string, d: string) => boolean
  isToday: (d: Date) => boolean; isPast: (d: Date) => boolean; hoveredCell: string | null; setHoveredCell: (v: string | null) => void
  onEventClick: (ev: CalendarEvent) => void
}) {
  // Compute day selection range
  function getDayCellType(salonId: string, dateStr: string, colIdx: number): "selected" | "range" | null {
    if (!daySel || daySel.salonId !== salonId) return null
    const coreDate = daySel.startDate
    const startD = addDays(new Date(coreDate + "T12:00:00"), -daySel.daysBefore)
    const endD = addDays(new Date(coreDate + "T12:00:00"), daySel.daysAfter)
    const rangeStart = toDateStr(startD)
    const rangeEnd = toDateStr(endD)
    if (dateStr < rangeStart || dateStr > rangeEnd) return null
    if (dateStr === coreDate && daySel.daysBefore === 0 && daySel.daysAfter === 0) return "selected"
    return "range"
  }

  function isLeftEdge(salonId: string, dateStr: string): boolean {
    if (!daySel || daySel.salonId !== salonId) return false
    const startD = addDays(new Date(daySel.startDate + "T12:00:00"), -daySel.daysBefore)
    return dateStr === toDateStr(startD)
  }

  function isRightEdge(salonId: string, dateStr: string): boolean {
    if (!daySel || daySel.salonId !== salonId) return false
    const endD = addDays(new Date(daySel.startDate + "T12:00:00"), daySel.daysAfter)
    return dateStr === toDateStr(endD)
  }

  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10"><tr className="bg-blue-50">
        <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[100px] sticky left-0 bg-blue-50 z-20">Salón</th>
        {days.map((d) => { const t = isToday(d); return <th key={toDateStr(d)} className={`text-center p-2 border-b border-r border-blue-100 ${t ? "bg-blue-600 text-white" : "text-blue-700"}`}><div className="text-[10px] uppercase tracking-wide">{DAYS_ES[d.getDay()]}</div><div className={`text-base font-bold ${t ? "text-white" : "text-blue-900"}`}>{d.getDate()}</div></th> })}
      </tr></thead>
      <tbody>{salones.map((salon) => (
        <tr key={salon.value} className="group">
          <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 truncate w-[100px]">{salon.text}</td>
          {days.map((d, colIdx) => {
            const ds = toDateStr(d), evts = getEventsForCell(salon.value, ds)
            const res = evts.filter(e => e.tipo === "reservacion"), cot = evts.filter(e => e.tipo === "cotizacion")
            const past = isPast(d), hov = hoveredCell === `${salon.value}-${ds}`
            const dayCt = getDayCellType(salon.value, ds, colIdx)
            const leftEdge = isLeftEdge(salon.value, ds)
            const rightEdge = isRightEdge(salon.value, ds)
            const isInRange = dayCt !== null

            return <td key={ds} className={`border-b border-r border-blue-50 p-1 align-top min-h-[56px] h-[56px] transition-all relative select-none ${
              past ? "bg-gray-50/80 cursor-not-allowed"
              : dayCt === "selected" ? "bg-blue-200 ring-2 ring-inset ring-blue-500 cursor-pointer"
              : dayCt === "range" ? "bg-blue-100 ring-2 ring-inset ring-blue-400 cursor-pointer"
              : hov ? "bg-blue-50 cursor-pointer" : "cursor-pointer hover:bg-blue-50/50"
            }`}
              onClick={() => {
                if (past) return
                if (isInRange) { onRangeClick() } // click on range → go to day view
                else { onDayClick(d, salon.value) }
              }}
              onContextMenu={(e) => { e.preventDefault(); if (isInRange) onClearDaySel() }}
              onMouseEnter={() => {
                if (dayDragging) { onDayDragMove(ds) }
                else { setHoveredCell(`${salon.value}-${ds}`) }
              }}
              onMouseLeave={() => { if (!dayDragging) setHoveredCell(null) }}>

              {/* Events */}
              {res.slice(0, 2).map(r => <div key={`r-${r.id}`} className="rounded px-1.5 py-0.5 mb-0.5 border text-[10px] leading-tight truncate bg-purple-100 border-purple-400 text-purple-900 cursor-pointer hover:bg-purple-200 transition-colors" onClick={(e) => { e.stopPropagation(); onEventClick(r) }}><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-900 flex-shrink-0" /><span className="font-semibold truncate">{r.nombreevento?.slice(0, 10)}</span></div><div className="text-[9px] text-purple-600 opacity-70">{r.horainicio?.slice(0, 5)} – {r.horafin?.slice(0, 5)}</div></div>)}
              {res.length > 2 && <div className="text-[9px] text-purple-700 pl-1">+{res.length - 2}</div>}
              {cot.slice(0, 2).map(c => <div key={`c-${c.id}`} className="rounded px-1.5 py-0.5 mb-0.5 border text-[10px] leading-tight truncate bg-amber-50 border-amber-200 text-amber-800 cursor-pointer hover:bg-amber-100 transition-colors" onClick={(e) => { e.stopPropagation(); onEventClick(c) }}><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" /><span className="font-semibold truncate">{c.nombreevento?.slice(0, 10)}</span></div><div className="text-[9px] text-amber-600 opacity-70">{c.horainicio?.slice(0, 5)} – {c.horafin?.slice(0, 5)}</div></div>)}
              {cot.length > 2 && <div className="text-[9px] text-amber-500 pl-1">+{cot.length - 2}</div>}
              {evts.length === 0 && !past && !isInRange && <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-30"><span className="text-[10px] text-blue-400">Disponible</span></div>}

              {/* Selected range indicator */}
              {isInRange && evts.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[9px] text-blue-600 font-semibold">Clic para horarios →</span>
                </div>
              )}

              {/* LEFT drag handle */}
              {leftEdge && (
                <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-blue-400/20 rounded-l"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDayDrag("left", ds) }}>
                  <div className="w-1 h-8 rounded-full bg-blue-600 group-hover/handle:bg-blue-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                </div>
              )}

              {/* RIGHT drag handle */}
              {rightEdge && (
                <div className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group/handle hover:bg-blue-400/20 rounded-r"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDayDrag("right", ds) }}>
                  <div className="w-1 h-8 rounded-full bg-blue-600 group-hover/handle:bg-blue-800 group-hover/handle:w-1.5 transition-all shadow-sm" />
                </div>
              )}
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
function MonthView({ year, salones, events, onMonthClick }: {
  year: number; salones: ddlItem[]; events: CalendarEvent[]
  onMonthClick: (month: number) => void
}) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Count events per salon per month
  function getMonthCounts(salonId: string, month: number): { res: number; cot: number } {
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`
    let res = 0, cot = 0
    for (const e of events) {
      if (e.salonid !== Number(salonId)) continue
      if (e.fechainicio > monthEnd || e.fechafin < monthStart) continue
      if (e.tipo === "reservacion") res++; else cot++
    }
    return { res, cot }
  }

  const isPastMonth = (m: number) => year < currentYear || (year === currentYear && m < currentMonth)
  const isCurrentMonth = (m: number) => year === currentYear && m === currentMonth

  return (
    <table className="w-full border-collapse text-[11px] table-fixed">
      <thead className="sticky top-0 z-10">
        <tr className="bg-blue-50">
          <th className="text-left p-2 font-semibold text-blue-900 border-b border-r border-blue-200 w-[100px] sticky left-0 bg-blue-50 z-20">Salón</th>
          {MONTHS_SHORT.map((m, i) => (
            <th key={i} className={`text-center p-2 font-medium border-b border-r border-blue-100 ${
              isCurrentMonth(i) ? "bg-blue-600 text-white" : isPastMonth(i) ? "text-gray-400" : "text-blue-700"
            }`}>
              {m}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {salones.map((salon) => (
          <tr key={salon.value} className="group">
            <td className="p-2 font-semibold text-gray-800 border-b border-r border-blue-100 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 truncate w-[100px]">
              {salon.text}
            </td>
            {MONTHS_SHORT.map((_, month) => {
              const { res, cot } = getMonthCounts(salon.value, month)
              const past = isPastMonth(month)
              const current = isCurrentMonth(month)
              const total = res + cot

              return (
                <td key={month}
                  className={`border-b border-r border-blue-50 p-1.5 align-top transition-all h-[52px] ${
                    past ? "bg-gray-50/50 cursor-not-allowed"
                    : current ? "bg-blue-50 cursor-pointer hover:bg-blue-100"
                    : "cursor-pointer hover:bg-blue-50"
                  }`}
                  onClick={() => onMonthClick(month)}>
                  {total > 0 ? (
                    <div className="space-y-0.5">
                      {res > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-900 flex-shrink-0" />
                          <span className="text-[10px] text-purple-900 font-semibold">{res} res.</span>
                        </div>
                      )}
                      {cot > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-[10px] text-amber-700 font-semibold">{cot} cot.</span>
                        </div>
                      )}
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

/* ==================================================
  Event Detail Modal
================================================== */
function EventDetailModal({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  if (!event) return null
  const isRes = event.tipo === "reservacion"
  const statusColor = (() => {
    const s = event.estatus?.toLowerCase() || ""
    if (s.includes("confirm")) return "bg-green-100 text-green-800 border-green-300"
    if (s.includes("cancel")) return "bg-red-100 text-red-800 border-red-300"
    if (s.includes("pendiente")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-gray-100 text-gray-700 border-gray-300"
  })()

  return (
    <Dialog open={!!event} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">
        <div className={`px-4 py-3 ${isRes ? "bg-purple-900" : "bg-amber-400"}`}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRes ? "bg-white" : "bg-amber-900"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isRes ? "text-purple-200" : "text-amber-800"}`}>
                {isRes ? "Reservación" : "Cotización"}
              </span>
            </div>
            <DialogTitle className={`text-base font-bold mt-1 ${isRes ? "text-white" : "text-amber-900"}`}>
              {event.nombreevento}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-4 py-3 space-y-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {event.estatus || "Sin estatus"}
          </span>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div><div className="text-[10px] text-gray-400 uppercase">Salón</div><div className="text-sm font-medium text-gray-800">{event.salonName}</div></div>
            </div>
            <div className="flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div><div className="text-[10px] text-gray-400 uppercase">Cliente</div><div className="text-sm font-medium text-gray-800">{event.cliente || "—"}</div></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div><div className="text-[10px] text-gray-400 uppercase">Fecha</div><div className="text-sm font-medium text-gray-800">{event.fechainicio === event.fechafin ? event.fechainicio : `${event.fechainicio} → ${event.fechafin}`}</div></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div><div className="text-[10px] text-gray-400 uppercase">Horario</div><div className="text-sm font-medium text-gray-800">{event.horainicio?.slice(0, 5) || "—"} – {event.horafin?.slice(0, 5) || "—"}</div></div>
            </div>
            {event.numeroinvitados > 0 && (
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div><div className="text-[10px] text-gray-400 uppercase">Invitados</div><div className="text-sm font-medium text-gray-800">{event.numeroinvitados}</div></div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
