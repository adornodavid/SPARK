"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  DoorClosed,
  Plus,
  FileText,
  Loader2,
} from "lucide-react"
import { obtenerEventosPorDia } from "@/app/actions/calendario"
import type { oCalendario } from "@/types/calendario"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getEstatusComercialStyle, normalizarEstatusComercial } from "./estatus-comercial-colors"

interface DayDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string | null // "YYYY-MM-DD"
  selectedHotel: string
  selectedSalon: string
  filters?: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }
}

export default function DayDetailSheet({
  open,
  onOpenChange,
  selectedDate,
  selectedHotel,
  selectedSalon,
  filters,
}: DayDetailSheetProps) {
  const router = useRouter()
  const [allEventos, setAllEventos] = useState<oCalendario[]>([])
  const [loading, setLoading] = useState(false)

  // Filtra por estatuscomercial sin refetch — sólo filtros client-side.
  const eventos = useMemo(() => {
    if (!filters) return allEventos
    return allEventos.filter((e) => {
      const ec = normalizarEstatusComercial((e as any).estatuscomercial)
      if (ec === "Tentativo" && !filters.tentativo) return false
      if (ec === "Definitivo" && !filters.definitivo) return false
      if (ec === "Cancelado" && !filters.cancelado) return false
      return true
    })
  }, [allEventos, filters])

  useEffect(() => {
    if (!open || !selectedDate) return

    const fetchEventos = async () => {
      setLoading(true)
      try {
        const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
        const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)
        const result = await obtenerEventosPorDia(selectedDate, hotelId, salonId)

        if (result.success && Array.isArray(result.data)) {
          setAllEventos(result.data as oCalendario[])
        } else {
          setAllEventos([])
          if (!result.success) {
            toast.error("Error cargando eventos del dia")
          }
        }
      } catch {
        toast.error("Error de conexion al cargar eventos")
        setAllEventos([])
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [open, selectedDate, selectedHotel, selectedSalon])

  const getStatusColor = (evento: oCalendario) =>
    getEstatusComercialStyle((evento as any).estatuscomercial).soft

  const getStatusBadge = (evento: oCalendario) => {
    const style = getEstatusComercialStyle((evento as any).estatuscomercial)
    return (
      <Badge variant="outline" className={`${style.border} text-[10px]`}>
        {style.label}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00")
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helpers de navegación — comparten params (hotel/salon/fecha) y cierran el sheet.
  const buildQs = () => {
    const params = new URLSearchParams()
    if (selectedHotel !== "all") params.set("hotelId", selectedHotel)
    if (selectedSalon !== "all") params.set("salonId", selectedSalon)
    if (selectedDate) {
      params.set("fechaInicio", selectedDate)
      params.set("fechaFin", selectedDate)
    }
    return params.toString()
  }

  const irACotizacion = () => {
    onOpenChange(false)
    const qs = buildQs()
    router.push(`/cotizaciones/new${qs ? `?${qs}` : ""}`)
  }

  const irAReservacionInterna = () => {
    onOpenChange(false)
    const qs = buildQs()
    router.push(`/reservacion-interna/new${qs ? `?${qs}` : ""}`)
  }

  const editarEvento = (evento: oCalendario) => {
    onOpenChange(false)
    const esInterno = (((evento as any).categoriaevento || "") as string).toLowerCase().trim() === "interno"
    const ruta = esInterno
      ? `/reservacion-interna/new?editId=${evento.id}`
      : `/cotizaciones/new?editId=${evento.id}`
    router.push(ruta)
  }

  // Group events by hotel for multi-property view
  const eventosPorHotel = eventos.reduce(
    (acc, evento) => {
      const hotelName = evento.hotel || "Sin hotel"
      if (!acc[hotelName]) acc[hotelName] = []
      acc[hotelName].push(evento)
      return acc
    },
    {} as Record<string, oCalendario[]>,
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-lime-600" />
            Eventos del Dia
          </SheetTitle>
          {selectedDate && (
            <SheetDescription className="text-sm capitalize">
              {formatDate(selectedDate)}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-4 space-y-4 px-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No hay eventos para esta fecha
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este dia esta disponible para nuevas cotizaciones
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  onClick={() => irAReservacionInterna()}
                >
                  <Plus className="h-4 w-4" />
                  Reservación Interna
                </Button>
                <Button
                  className="flex-1 gap-2 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => irACotizacion()}
                >
                  <Plus className="h-4 w-4" />
                  Generar Cotización
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Summary + Acciones rápidas */}
              <div className="flex items-center justify-between gap-2 px-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="font-medium">{eventos.length} evento{eventos.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{Object.keys(eventosPorHotel).length} hotel{Object.keys(eventosPorHotel).length !== 1 ? "es" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={() => irAReservacionInterna()}
                  >
                    <Plus className="h-3 w-3" />
                    Reservación Interna
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] gap-1 bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => irACotizacion()}
                  >
                    <Plus className="h-3 w-3" />
                    Generar Cotización
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Events grouped by hotel */}
              {Object.entries(eventosPorHotel).map(([hotelName, hotelEventos]) => (
                <div key={hotelName} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <Building2 className="h-4 w-4 text-lime-600" />
                    <h3 className="text-sm font-bold">{hotelName}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {hotelEventos.length}
                    </Badge>
                  </div>

                  {hotelEventos.map((evento, idx) => (
                    <Card
                      key={`${evento.tipo}-${evento.id}-${(evento as any).reservacionid ?? (evento as any).salonid ?? "x"}-${(evento as any).horainicio ?? "h"}-${idx}`}
                      className={`border-l-4 ${getStatusColor(evento)} cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => editarEvento(evento)}
                    >
                      <CardContent className="px-2 py-1.5 space-y-1">
                        {/* Header — título + folio inline + badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold truncate leading-tight">
                              {evento.nombreevento}
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              {evento.folio}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {getStatusBadge(evento)}
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 leading-tight"
                            >
                              {evento.tipo}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-[10px] leading-snug">
                          <div className="flex items-center gap-1">
                            <DoorClosed className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{evento.salon}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{evento.cliente}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <span>
                              {evento.horainicio} - {evento.horafin}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{evento.montaje}</span>
                          </div>
                          {evento.numeroinvitados > 0 && (
                            <div className="flex items-center gap-1 col-span-2">
                              <Users className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                              <span>{evento.numeroinvitados} invitados</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {evento.notas && (
                          <p className="text-[10px] text-muted-foreground italic">
                            {evento.notas}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}

              <Separator />

              {/* Quick Actions: mismos botones que en el header */}
              <div className="pt-2 pb-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  onClick={() => irAReservacionInterna()}
                >
                  <Plus className="h-4 w-4" />
                  Reservación Interna
                </Button>
                <Button
                  className="flex-1 gap-2 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => irACotizacion()}
                >
                  <Plus className="h-4 w-4" />
                  Generar Cotización
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
