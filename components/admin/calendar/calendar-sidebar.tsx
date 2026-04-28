"use client"

import { useEffect, useState, useMemo, useRef } from "react"
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
import { getEstatusComercialStyle, normalizarEstatusComercial } from "./estatus-comercial-colors"

interface CalendarSidebarProps {
  selectedHotel: string
  selectedSalon: string
  filters: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }
  onEventClick: (dateStr: string) => void
}

export default function CalendarSidebar({
  selectedHotel,
  selectedSalon,
  filters,
  onEventClick,
}: CalendarSidebarProps) {
  // Guardamos TODOS los eventos del rango. Upcoming + stats se derivan con useMemo
  // en base a `filters`, así los checkboxes de estatus no disparan refetch.
  const [allEventos, setAllEventos] = useState<oCalendario[]>([])
  const [loading, setLoading] = useState(true)
  // reqId protege contra stale responses: si el usuario cambia hotel/salon rápidamente,
  // solo el último request escribe el state. Esto evita loading que nunca termina si
  // una respuesta anterior llegara después de la nueva.
  const reqIdRef = useRef(0)

  useEffect(() => {
    const reqId = ++reqIdRef.current
    let cancelado = false
    setLoading(true)
    ;(async () => {
      try {
        const today = new Date()
        const rangoInicio = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + 3)
        const rangoFin = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`

        const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
        const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)

        const result = await obtenerCalendariosPorRango(rangoInicio, rangoFin, hotelId, salonId)

        if (cancelado || reqId !== reqIdRef.current) return
        if (result.success && Array.isArray(result.data)) {
          setAllEventos(result.data as oCalendario[])
        } else {
          setAllEventos([])
        }
      } catch (err) {
        console.error("[CalendarSidebar] fetch error:", err)
        if (!cancelado && reqId === reqIdRef.current) setAllEventos([])
      } finally {
        if (!cancelado && reqId === reqIdRef.current) setLoading(false)
      }
    })()
    return () => { cancelado = true }
  }, [selectedHotel, selectedSalon])

  // Derivar upcoming y statistics en base a filtros — sin refetch.
  const { upcomingEvents, statistics } = useMemo(() => {
    const today = new Date()
    const rangoInicio = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    const pasaFiltro = (e: oCalendario) => {
      const ec = normalizarEstatusComercial((e as any).estatuscomercial)
      if (ec === "Tentativo" && !filters.tentativo) return false
      if (ec === "Definitivo" && !filters.definitivo) return false
      if (ec === "Cancelado" && !filters.cancelado) return false
      return true
    }
    const filtrados = allEventos.filter(pasaFiltro)
    const upcomingEvents = filtrados
      .filter((e) => e.fechainicio >= rangoInicio)
      .sort((a, b) => a.fechainicio.localeCompare(b.fechainicio))
      .slice(0, 7)
    // Stats reflejan los filtros seleccionados
    const totalEventos = filtrados.length
    const eventosTentativos = filtrados.filter((e) => normalizarEstatusComercial((e as any).estatuscomercial) === "Tentativo").length
    const eventosDefinitivos = filtrados.filter((e) => normalizarEstatusComercial((e as any).estatuscomercial) === "Definitivo").length
    const eventosCancelados = filtrados.filter((e) => normalizarEstatusComercial((e as any).estatuscomercial) === "Cancelado").length
    const topSalones = Object.entries(
      filtrados.reduce(
        (acc, e) => {
          if (e.salon) acc[e.salon] = (acc[e.salon] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) as [string, number][]
    // Top hoteles basado en eventos Definitivos (confirmados) dentro del filtro
    const topHoteles = Object.entries(
      filtrados
        .filter((e) => normalizarEstatusComercial((e as any).estatuscomercial) === "Definitivo")
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
    return {
      upcomingEvents,
      statistics: { totalEventos, eventosTentativos, eventosDefinitivos, eventosCancelados, topSalones, topHoteles },
    }
  }, [allEventos, filters])

  const getStatusBadgeClass = (evento: oCalendario) =>
    getEstatusComercialStyle((evento as any).estatuscomercial).border

  const getCardBorderClass = (evento: oCalendario) =>
    getEstatusComercialStyle((evento as any).estatuscomercial).borderLeft

  const getEventLabel = (evento: oCalendario) =>
    getEstatusComercialStyle((evento as any).estatuscomercial).label

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <Card className="rounded-xl border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Proximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No hay eventos programados</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Los proximos eventos apareceran aqui
                  </p>
                </div>
              ) : (
                upcomingEvents.map((evento, index) => (
                  <div
                    key={`${evento.tipo}-${evento.id}-${index}`}
                    onClick={() => onEventClick(evento.fechainicio)}
                    className={`px-2.5 py-1.5 rounded-md border border-border hover:shadow-md transition-all cursor-pointer ${getCardBorderClass(evento)}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-xs truncate flex-1">
                        {evento.nombreevento}
                      </h3>
                      <Badge variant="outline" className={`${getStatusBadgeClass(evento)} text-[9px] px-1.5 py-0 leading-tight shrink-0`}>
                        {getEventLabel(evento)}
                      </Badge>
                    </div>
                    <div className="space-y-0.5 text-[10px] text-muted-foreground leading-tight">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {new Date(evento.fechainicio + "T12:00:00").toLocaleDateString("es-MX", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{evento.hotel} · {evento.salon}</span>
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
              {/* Counters — total + conteos por estatus comercial */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                    <p className="text-[10px] font-medium text-blue-900 text-center">Total</p>
                    <span className="text-lg font-bold text-blue-700">{statistics.totalEventos}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-yellow-50 to-yellow-100/50">
                  <div className="flex flex-col items-center">
                    <FileText className="h-3.5 w-3.5 text-yellow-700 mb-0.5" />
                    <p className="text-[10px] font-medium text-yellow-900 text-center">Tentativos</p>
                    <span className="text-lg font-bold text-yellow-800">{statistics.eventosTentativos}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mb-0.5" />
                    <p className="text-[10px] font-medium text-emerald-900 text-center">Definitivos</p>
                    <span className="text-lg font-bold text-emerald-800">{statistics.eventosDefinitivos}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-red-50 to-red-100/50">
                  <div className="flex flex-col items-center">
                    <Clock className="h-3.5 w-3.5 text-red-700 mb-0.5" />
                    <p className="text-[10px] font-medium text-red-900 text-center">Cancelados</p>
                    <span className="text-lg font-bold text-red-800">{statistics.eventosCancelados}</span>
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
