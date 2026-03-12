"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  BarChart3,
  FileText,
  CheckCircle2,
  DoorClosed,
  Building2,
  Loader2,
} from "lucide-react"
import { obtenerCalendariosPorRango } from "@/app/actions/calendario"
import type { oCalendario } from "@/types/calendario"

interface CalendarSidebarProps {
  selectedHotel: string
  selectedSalon: string
  onEventClick: (dateStr: string) => void
}

export default function CalendarSidebar({
  selectedHotel,
  selectedSalon,
  onEventClick,
}: CalendarSidebarProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<oCalendario[]>([])
  const [statistics, setStatistics] = useState({
    totalEventos: 0,
    eventosCotizados: 0,
    eventosReservados: 0,
    topSalones: [] as [string, number][],
    topHoteles: [] as [string, number][],
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const rangoInicio = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

      // 3 months forward for upcoming events and stats
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      const rangoFin = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`

      const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
      const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)

      const result = await obtenerCalendariosPorRango(rangoInicio, rangoFin, hotelId, salonId)

      if (result.success && Array.isArray(result.data)) {
        const allEventos = result.data as oCalendario[]

        // Upcoming events - solo reservaciones (next 7)
        const upcoming = allEventos
          .filter((e) => e.fechainicio >= rangoInicio && e.tipo === "Reservacion")
          .sort((a, b) => a.fechainicio.localeCompare(b.fechainicio))
          .slice(0, 7)
        setUpcomingEvents(upcoming)

        // Statistics
        const totalEventos = allEventos.length
        const eventosCotizados = allEventos.filter((e) => e.tipo === "Cotizacion").length
        const eventosReservados = allEventos.filter((e) => e.tipo === "Reservacion").length

        const topSalones = Object.entries(
          allEventos.reduce(
            (acc, e) => {
              if (e.salon) acc[e.salon] = (acc[e.salon] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          ),
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3) as [string, number][]

        const topHoteles = Object.entries(
          allEventos
            .filter((e) => e.tipo === "Reservacion")
            .reduce(
              (acc, e) => {
                if (e.hotel) acc[e.hotel] = (acc[e.hotel] || 0) + 1
                return acc
              },
              {} as Record<string, number>,
            ),
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3) as [string, number][]

        setStatistics({ totalEventos, eventosCotizados, eventosReservados, topSalones, topHoteles })
      }
    } catch {
      // Silently fail - sidebar is not critical
    } finally {
      setLoading(false)
    }
  }, [selectedHotel, selectedSalon])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadgeClass = (evento: oCalendario) => {
    if (evento.tipo === "Cotizacion") return "border-amber-500 text-amber-700"
    if (evento.estatus === "cancelada") return "border-gray-400 text-gray-600"
    if (evento.estatus === "pendiente") return "border-cyan-500 text-cyan-700"
    return "border-red-500 text-red-700"
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <Card className="rounded-xl border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Proximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay eventos programados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Los proximos eventos apareceran aqui
                  </p>
                </div>
              ) : (
                upcomingEvents.map((evento, index) => (
                  <div
                    key={`${evento.tipo}-${evento.id}-${index}`}
                    onClick={() => onEventClick(evento.fechainicio)}
                    className="p-4 rounded-lg border border-border hover:border-lime-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-base truncate flex-1 mr-2">
                        {evento.nombreevento}
                      </h3>
                      <Badge variant="outline" className={getStatusBadgeClass(evento)}>
                        {evento.estatus}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(evento.fechainicio + "T12:00:00").toLocaleDateString("es-MX", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {evento.hotel} - {evento.salon}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="rounded-xl border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadisticas (Prox. 3 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Counters */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                    <p className="text-[10px] font-medium text-blue-900 text-center">Total</p>
                    <span className="text-lg font-bold text-blue-700">{statistics.totalEventos}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-amber-50 to-amber-100/50">
                  <div className="flex flex-col items-center">
                    <FileText className="h-3.5 w-3.5 text-amber-600 mb-0.5" />
                    <p className="text-[10px] font-medium text-amber-900 text-center">Cotizados</p>
                    <span className="text-lg font-bold text-amber-700">{statistics.eventosCotizados}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-red-50 to-red-100/50">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-red-600 mb-0.5" />
                    <p className="text-[10px] font-medium text-red-900 text-center">Reservados</p>
                    <span className="text-lg font-bold text-red-700">{statistics.eventosReservados}</span>
                  </div>
                </div>
              </div>

              {/* Top 3 Salones */}
              <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-teal-50 to-teal-100/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <DoorClosed className="h-3.5 w-3.5 text-teal-600" />
                  <h3 className="text-[10px] font-bold text-teal-900">Top 3 Salones</h3>
                </div>
                <div className="space-y-1">
                  {statistics.topSalones.length > 0 ? (
                    statistics.topSalones.map(([salon, count], index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-1.5 py-1 bg-card/60 rounded text-[10px]"
                      >
                        <p className="truncate flex-1" title={salon}>
                          {salon}
                        </p>
                        <span className="font-bold text-teal-700 ml-1">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-center text-muted-foreground py-1">No hay datos</p>
                  )}
                </div>
              </div>

              {/* Top 3 Hoteles */}
              <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-green-50 to-green-100/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Building2 className="h-3.5 w-3.5 text-green-600" />
                  <h3 className="text-[10px] font-bold text-green-900">Top 3 Hoteles</h3>
                </div>
                <div className="space-y-1">
                  {statistics.topHoteles.length > 0 ? (
                    statistics.topHoteles.map(([hotel, count], index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-1.5 py-1 bg-card/60 rounded text-[10px]"
                      >
                        <p className="truncate flex-1" title={hotel}>
                          {hotel}
                        </p>
                        <span className="font-bold text-green-700 ml-1">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-center text-muted-foreground py-1">No hay datos</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
