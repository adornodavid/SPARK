"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react"
import { obtenerCalendariosPorRango } from "@/app/actions/calendario"
import type { oCalendario } from "@/types/calendario"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ESTATUS_COMERCIAL_ORDER,
  estatusComercialPresentes,
  getEstatusComercialStyle,
  normalizarEstatusComercial,
  type EstatusComercial,
} from "./estatus-comercial-colors"

interface CalendarGridProps {
  selectedHotel: string
  selectedSalon: string
  filters: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }
  onDayClick: (dateStr: string) => void
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DAY_HEADERS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

// Navigation limits: 12 months back, 24 months forward
const getMinDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 12)
  return { month: d.getMonth(), year: d.getFullYear() }
}
const getMaxDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 24)
  return { month: d.getMonth(), year: d.getFullYear() }
}

export default function CalendarGrid({
  selectedHotel,
  selectedSalon,
  filters,
  onDayClick,
}: CalendarGridProps) {
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [eventos, setEventos] = useState<oCalendario[]>([])
  const [loading, setLoading] = useState(false)
  const [showYearView, setShowYearView] = useState(false)

  const minDate = getMinDate()
  const maxDate = getMaxDate()

  // Check if can navigate
  const canGoBack = currentYear > minDate.year || (currentYear === minDate.year && currentMonth > minDate.month)
  const canGoForward = currentYear < maxDate.year || (currentYear === maxDate.year && currentMonth < maxDate.month)

  // Calculate date range for current month view (with buffer for events that span months)
  const getMonthRange = useCallback((month: number, year: number) => {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0) // Last day of month
    const rangoInicio = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`
    const rangoFin = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
    return { rangoInicio, rangoFin }
  }, [])

  // For year view, get the full year range
  const getYearRange = useCallback((year: number) => {
    return { rangoInicio: `${year}-01-01`, rangoFin: `${year}-12-31` }
  }, [])

  // reqId protege contra stale responses: el último fetch siempre gana.
  const reqIdRef = useRef(0)

  // Fetch events for current view
  useEffect(() => {
    const reqId = ++reqIdRef.current
    let cancelado = false
    setLoading(true)
    ;(async () => {
      try {
        const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
        const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)

        const range = showYearView
          ? getYearRange(currentYear)
          : getMonthRange(currentMonth, currentYear)

        const result = await obtenerCalendariosPorRango(
          range.rangoInicio,
          range.rangoFin,
          hotelId,
          salonId,
        )

        if (cancelado || reqId !== reqIdRef.current) return
        if (result.success && Array.isArray(result.data)) {
          setEventos(result.data as oCalendario[])
        } else {
          setEventos([])
        }
      } catch (err) {
        console.error("[CalendarGrid] fetch error:", err)
        if (!cancelado && reqId === reqIdRef.current) {
          toast.error("Error al cargar eventos del calendario")
          setEventos([])
        }
      } finally {
        if (!cancelado && reqId === reqIdRef.current) setLoading(false)
      }
    })()
    return () => { cancelado = true }
  }, [currentMonth, currentYear, selectedHotel, selectedSalon, showYearView, getMonthRange, getYearRange])

  // Filter events por estatuscomercial (Tentativo / Definitivo / Cancelado).
  // Valores fuera de ese set pasan siempre (defensivo: no ocultamos por desconocimiento).
  const getFilteredEventos = useCallback(() => {
    return eventos.filter((evento) => {
      const ec = String((evento as any).estatuscomercial || "").trim()
      if (ec === "Tentativo" && !filters.tentativo) return false
      if (ec === "Definitivo" && !filters.definitivo) return false
      if (ec === "Cancelado" && !filters.cancelado) return false
      return true
    })
  }, [eventos, filters])

  // Get events for a specific day
  const getEventosForDay = useCallback(
    (day: number, month: number, year: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      return getFilteredEventos().filter((evento) => {
        return dateStr >= evento.fechainicio && dateStr <= evento.fechafin
      })
    },
    [getFilteredEventos],
  )

  // Color coding por `estatuscomercial` (Tentativo / Definitivo / Cancelado).
  // Color sólido de fondo cuando todos los eventos del día comparten estatuscomercial.
  // Si hay >1 estatus presente, retorna "" (el gradient lo maneja).
  const getDayStatusColor = (dayEvents: oCalendario[]) => {
    if (dayEvents.length === 0) return ""
    const presentes = estatusComercialPresentes(dayEvents)
    if (presentes.length === 1) {
      return getEstatusComercialStyle(presentes[0]).fill
    }
    if (presentes.length === 0) {
      // Eventos sin estatuscomercial reconocido
      return getEstatusComercialStyle(null).fill
    }
    return "" // gradient
  }

  // Formateador compacto de montos ($12K si >=1000, si no $N)
  const fmtMonto = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
    return `$${Math.round(n)}`
  }

  // Gradient diagonal para días con 2 o 3 estatus comerciales presentes.
  const getDayDiagonalStyle = (presentes: EstatusComercial[]): React.CSSProperties | undefined => {
    if (presentes.length < 2) return undefined
    const colors = presentes.map((k) => getEstatusComercialStyle(k).rgb)
    if (colors.length === 2) {
      return { background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` }
    }
    return {
      background: `linear-gradient(135deg, ${colors[0]} 33%, ${colors[1]} 33%, ${colors[1]} 66%, ${colors[2]} 66%)`,
    }
  }

  // Calendar math helpers
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const isPastDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dayDate < todayDate
  }

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  const goToPreviousMonth = () => {
    if (!canGoBack) return
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (!canGoForward) return
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setShowYearView(false)
  }

  const handleDayClick = (day: number, month?: number, year?: number) => {
    const m = month ?? currentMonth
    const y = year ?? currentYear
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onDayClick(dateStr)
  }

  // Build calendar days array for current month
  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const calendarDays: (number | null)[] = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(day)
    return days
  }, [firstDay, daysInMonth])

  return (
    <Card className="rounded-xl border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={!canGoBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setShowYearView(!showYearView)}
              className="text-xl font-bold min-w-[180px] text-center hover:text-lime-600 transition-colors"
            >
              {showYearView ? currentYear : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              disabled={!canGoForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
              Hoy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button
              variant="outline"
              onClick={() => router.push("/reservacion-interna/new")}
              className="gap-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <Plus className="h-4 w-4" />
              Reservación Interna
            </Button>
            <Button
              onClick={() => {
                const params = new URLSearchParams()
                if (selectedHotel !== "all") params.set("hotelId", selectedHotel)
                if (selectedSalon !== "all") params.set("salonId", selectedSalon)
                const qs = params.toString()
                router.push(`/cotizaciones/new${qs ? `?${qs}` : ""}`)
              }}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              Generar Cotizacion
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {showYearView ? (
          /* ========== YEAR VIEW ========== */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Vista Anual - {currentYear}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowYearView(false)}>
                Volver a Vista Mensual
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const daysInThisMonth = getDaysInMonth(monthIndex, currentYear)
                const firstDayOfThisMonth = getFirstDayOfMonth(monthIndex, currentYear)
                const miniDays: (number | null)[] = []

                for (let i = 0; i < firstDayOfThisMonth; i++) miniDays.push(null)
                for (let day = 1; day <= daysInThisMonth; day++) miniDays.push(day)

                return (
                  <div key={monthIndex} className="border rounded-lg p-2">
                    <button
                      onClick={() => {
                        setCurrentMonth(monthIndex)
                        setShowYearView(false)
                      }}
                      className="text-sm font-semibold mb-2 hover:text-lime-600 transition-colors w-full text-center"
                    >
                      {monthName}
                    </button>
                    <div className="grid grid-cols-7 gap-0.5 text-xs">
                      {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
                        <div key={i} className="text-center font-medium text-muted-foreground p-0.5">
                          {day}
                        </div>
                      ))}
                      {miniDays.map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const dayEventos = getEventosForDay(day, monthIndex, currentYear)
                        const hasEvents = dayEventos.length > 0
                        const colorClass = getDayStatusColor(dayEventos)

                        const dayDateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        const isTodayMini = dayDateStr === todayString

                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentMonth(monthIndex)
                              setShowYearView(false)
                            }}
                            className={`
                              aspect-square flex items-center justify-center text-[10px] rounded
                              transition-colors
                              ${hasEvents ? `${colorClass} hover:opacity-80` : "hover:bg-muted"}
                              ${isTodayMini ? "ring-1 ring-lime-600 ring-offset-1" : ""}
                            `}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ========== MONTH VIEW ========== */
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAY_HEADERS.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const past = day ? isPastDay(day) : false
                const isTodayDay = day ? isToday(day) : false
                const eventosDelDia = day ? getEventosForDay(day, currentMonth, currentYear) : []
                const hasEvents = eventosDelDia.length > 0
                const statusColor = getDayStatusColor(eventosDelDia)
                const presentes = estatusComercialPresentes(eventosDelDia)
                const esMulti = presentes.length >= 2
                const eventosPorEstatus: Record<EstatusComercial, oCalendario[]> = {
                  Tentativo: [],
                  Definitivo: [],
                  Cancelado: [],
                }
                const totalPorEstatus: Record<EstatusComercial, number> = {
                  Tentativo: 0,
                  Definitivo: 0,
                  Cancelado: 0,
                }
                for (const ev of eventosDelDia) {
                  const k = normalizarEstatusComercial((ev as any).estatuscomercial)
                  if (!k) continue
                  eventosPorEstatus[k].push(ev)
                  totalPorEstatus[k] += Number((ev as any).totalmonto) || 0
                }

                return (
                  <div
                    key={index}
                    onClick={() => day && handleDayClick(day)}
                    className={`
                      relative aspect-square rounded-lg transition-all duration-200 cursor-pointer overflow-hidden
                      ${day === null ? "bg-transparent cursor-default" : ""}
                      ${past && day !== null && !hasEvents ? "bg-muted/20 text-muted-foreground/50" : ""}
                      ${!past && day !== null && !hasEvents
                        ? "bg-card border border-border hover:border-lime-500 hover:shadow-lg hover:scale-105"
                        : ""
                      }
                      ${day !== null && hasEvents && !esMulti
                        ? `hover:scale-105 hover:shadow-xl ${statusColor} ${past ? "opacity-25" : ""}`
                        : ""
                      }
                      ${day !== null && hasEvents && esMulti
                        ? `hover:scale-105 hover:shadow-xl ${past ? "opacity-25" : ""}`
                        : ""
                      }
                      ${isTodayDay ? "ring-2 ring-lime-600 ring-offset-2" : ""}
                    `}
                  >
                    {day && hasEvents && esMulti && (
                      <>
                        {/* Fondo en gradient diagonal (cubre la tarjeta) */}
                        <div
                          className="absolute inset-0"
                          style={getDayDiagonalStyle(presentes)}
                        />
                        {/* Texto por cuña — alineado al corner que le corresponde */}
                        {presentes[0] && (
                          <div className="absolute top-1 left-1 text-[0.7rem] font-bold text-white leading-[1.15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] z-[5]">
                            <div>{eventosPorEstatus[presentes[0]].length} {presentes[0].slice(0, 4).toLowerCase()}.</div>
                            <div>{fmtMonto(totalPorEstatus[presentes[0]])}</div>
                          </div>
                        )}
                        {presentes[1] && presentes.length === 2 && (
                          <div className="absolute bottom-1 right-1 text-right text-[0.7rem] font-bold text-white leading-[1.15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] z-[5]">
                            <div>{eventosPorEstatus[presentes[1]].length} {presentes[1].slice(0, 4).toLowerCase()}.</div>
                            <div>{fmtMonto(totalPorEstatus[presentes[1]])}</div>
                          </div>
                        )}
                        {presentes.length === 3 && (
                          <>
                            {/* Segundo estatus en el centro de la diagonal */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[0.7rem] font-bold text-white leading-[1.15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] z-[5]">
                              <div>{eventosPorEstatus[presentes[1]].length} {presentes[1].slice(0, 4).toLowerCase()}.</div>
                              <div>{fmtMonto(totalPorEstatus[presentes[1]])}</div>
                            </div>
                            {/* Tercero abajo-derecha */}
                            <div className="absolute bottom-1 right-1 text-right text-[0.7rem] font-bold text-white leading-[1.15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] z-[5]">
                              <div>{eventosPorEstatus[presentes[2]].length} {presentes[2].slice(0, 4).toLowerCase()}.</div>
                              <div>{fmtMonto(totalPorEstatus[presentes[2]])}</div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {day && (
                      <div className="relative z-10 flex flex-col h-full overflow-hidden p-2">
                        <div
                          className={`
                            text-sm font-bold mb-1 text-center
                            ${isTodayDay && !hasEvents ? "text-lime-600" : ""}
                            ${past && !hasEvents ? "text-muted-foreground/50" : ""}
                            ${hasEvents && !esMulti ? "text-white" : ""}
                            ${!hasEvents && !past && !isTodayDay ? "text-foreground" : ""}
                          `}
                        >
                          {hasEvents && esMulti ? (
                            <span className="inline-flex items-center justify-center text-white bg-black/50 rounded-full min-w-[22px] h-[22px] px-1.5 text-xs">
                              {day}
                            </span>
                          ) : (
                            day
                          )}
                        </div>
                        {!past && hasEvents && !esMulti && (
                          <div className="flex-1 flex flex-col gap-0.5 overflow-hidden text-white">
                            {eventosDelDia.slice(0, 1).map((evento, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5 text-[0.6rem] leading-tight">
                                <div className="font-bold truncate" title={evento.nombreevento}>
                                  {evento.nombreevento}
                                </div>
                                <div className="truncate opacity-90" title={evento.hotel}>
                                  {evento.hotel}
                                </div>
                                <div className="truncate opacity-90" title={evento.salon}>
                                  {evento.salon}
                                </div>
                              </div>
                            ))}
                            <div className="mt-auto flex flex-wrap gap-0.5 justify-center">
                              {presentes.map((k) => (
                                <span key={k} className="text-[0.65rem] font-bold bg-white/25 px-1 py-0.5 rounded">
                                  {eventosPorEstatus[k].length} {k.slice(0, 4).toLowerCase()}. · {fmtMonto(totalPorEstatus[k])}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {past && hasEvents && (
                          <div className="flex-1 flex items-end justify-center">
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-white/30">
                              {eventosDelDia.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
