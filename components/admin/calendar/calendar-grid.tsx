"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

interface CalendarGridProps {
  selectedHotel: string
  selectedSalon: string
  filters: {
    cotizaciones: boolean
    reservaciones: boolean
    canceladas: boolean
    confirmadas: boolean
    pendientes: boolean
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

  // Fetch events for current view
  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true)
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

        if (result.success && Array.isArray(result.data)) {
          setEventos(result.data as oCalendario[])
        } else {
          setEventos([])
        }
      } catch {
        toast.error("Error al cargar eventos del calendario")
        setEventos([])
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [currentMonth, currentYear, selectedHotel, selectedSalon, showYearView, getMonthRange, getYearRange])

  // Filter events based on type/status checkboxes
  const getFilteredEventos = useCallback(() => {
    return eventos.filter((evento) => {
      if (evento.tipo === "Cotizacion" && !filters.cotizaciones) return false
      if (evento.tipo === "Reservacion" && !filters.reservaciones) return false
      if (evento.estatus === "cancelada" && !filters.canceladas) return false
      if (
        (evento.estatus === "reservada" || evento.estatus === "confirmada") &&
        evento.tipo === "Reservacion" &&
        !filters.confirmadas
      )
        return false
      if (evento.estatus === "pendiente" && evento.tipo === "Reservacion" && !filters.pendientes)
        return false
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

  // Color coding per spec: green=available, amber=cotizado, red=confirmado, gray=realizado
  const getEventColor = (evento: oCalendario) => {
    // Cancelada / Realizado - Gray
    if (evento.estatus === "cancelada" || evento.estatus === "realizado") {
      return "bg-gray-400 text-white"
    }
    // Reservacion Confirmada/Pagada - Red
    if (evento.tipo === "Reservacion" && (evento.estatus === "reservada" || evento.estatus === "confirmada")) {
      return "bg-red-500 text-white"
    }
    // Reservacion Pendiente - Cyan/Blue
    if (evento.tipo === "Reservacion" && evento.estatus === "pendiente") {
      return "bg-cyan-500 text-white"
    }
    // Cotizacion - Amber/Yellow
    if (evento.tipo === "Cotizacion") {
      return "bg-amber-400 text-white"
    }
    return "bg-gray-300 text-white"
  }

  // Get priority color for a day (highest priority event determines cell color)
  const getDayStatusColor = (dayEvents: oCalendario[]) => {
    if (dayEvents.length === 0) return ""
    // Priority: confirmada > pendiente > cotizacion > cancelada
    const hasConfirmed = dayEvents.some(
      (e) => e.tipo === "Reservacion" && (e.estatus === "reservada" || e.estatus === "confirmada"),
    )
    if (hasConfirmed) return "bg-red-500 text-white"

    const hasPending = dayEvents.some(
      (e) => e.tipo === "Reservacion" && e.estatus === "pendiente",
    )
    if (hasPending) return "bg-cyan-500 text-white"

    const hasCotizacion = dayEvents.some((e) => e.tipo === "Cotizacion")
    if (hasCotizacion) return "bg-amber-400 text-white"

    return "bg-gray-400 text-white"
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
              onClick={() => router.push("/cotizarevento")}
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
                const primaryEvento = eventosDelDia[0]

                return (
                  <div
                    key={index}
                    onClick={() => day && handleDayClick(day)}
                    className={`
                      relative aspect-square p-2 rounded-lg transition-all duration-200 cursor-pointer
                      ${day === null ? "bg-transparent cursor-default" : ""}
                      ${past && day !== null ? "bg-muted/20 text-muted-foreground/50" : ""}
                      ${!past && day !== null && !hasEvents
                        ? "bg-card border border-border hover:border-lime-500 hover:shadow-lg hover:scale-105"
                        : ""
                      }
                      ${!past && day !== null && hasEvents
                        ? `hover:scale-105 hover:shadow-xl ${statusColor}`
                        : ""
                      }
                      ${isTodayDay ? "ring-2 ring-lime-600 ring-offset-2" : ""}
                    `}
                  >
                    {day && (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div
                          className={`
                            text-sm font-bold mb-1 text-center
                            ${isTodayDay && !hasEvents ? "text-lime-600" : ""}
                            ${past ? "text-muted-foreground/50" : ""}
                            ${hasEvents && !past ? "text-white" : ""}
                            ${!hasEvents && !past && !isTodayDay ? "text-foreground" : ""}
                          `}
                        >
                          {day}
                        </div>
                        {!past && hasEvents && (
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
                                <div className="text-[0.6rem] font-bold truncate bg-white/25 px-1 py-0.5 rounded text-center uppercase tracking-wide mt-auto">
                                  {evento.estatus}
                                </div>
                              </div>
                            ))}
                            {eventosDelDia.length > 1 && (
                              <div className="text-[0.55rem] text-center font-semibold bg-white/25 rounded px-1 py-0.5">
                                +{eventosDelDia.length - 1} mas
                              </div>
                            )}
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
