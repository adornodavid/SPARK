"use client"

import { useEffect, useState } from "react"
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

interface DayDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string | null // "YYYY-MM-DD"
  selectedHotel: string
  selectedSalon: string
}

export default function DayDetailSheet({
  open,
  onOpenChange,
  selectedDate,
  selectedHotel,
  selectedSalon,
}: DayDetailSheetProps) {
  const router = useRouter()
  const [eventos, setEventos] = useState<oCalendario[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !selectedDate) return

    const fetchEventos = async () => {
      setLoading(true)
      try {
        const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
        const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)
        const result = await obtenerEventosPorDia(selectedDate, hotelId, salonId)

        if (result.success && Array.isArray(result.data)) {
          setEventos(result.data as oCalendario[])
        } else {
          setEventos([])
          if (!result.success) {
            toast.error("Error cargando eventos del dia")
          }
        }
      } catch {
        toast.error("Error de conexion al cargar eventos")
        setEventos([])
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [open, selectedDate, selectedHotel, selectedSalon])

  const getStatusColor = (evento: oCalendario) => {
    if (evento.estatus === "cancelada") return "bg-muted border-border text-muted-foreground"
    if (evento.estatus === "realizado") return "bg-muted border-border text-muted-foreground"
    if (evento.tipo === "Reservacion" && (evento.estatus === "reservada" || evento.estatus === "confirmada"))
      return "bg-red-50 border-red-300 text-red-800"
    if (evento.tipo === "Reservacion" && evento.estatus === "pendiente")
      return "bg-cyan-50 border-cyan-300 text-cyan-800"
    if (evento.tipo === "Cotizacion") return "bg-amber-50 border-amber-300 text-amber-800"
    return "bg-muted border-border text-muted-foreground"
  }

  const getStatusBadge = (evento: oCalendario) => {
    if (evento.estatus === "cancelada")
      return <Badge variant="outline" className="border-gray-400 text-gray-600 text-[10px]">Cancelada</Badge>
    if (evento.estatus === "realizado")
      return <Badge variant="outline" className="border-gray-500 text-gray-600 text-[10px]">Realizado</Badge>
    if (evento.tipo === "Reservacion" && (evento.estatus === "reservada" || evento.estatus === "confirmada"))
      return <Badge variant="outline" className="border-red-500 text-red-700 text-[10px]">Confirmado</Badge>
    if (evento.tipo === "Reservacion" && evento.estatus === "pendiente")
      return <Badge variant="outline" className="border-cyan-500 text-cyan-700 text-[10px]">Pendiente</Badge>
    if (evento.tipo === "Cotizacion")
      return <Badge variant="outline" className="border-amber-500 text-amber-700 text-[10px]">Cotizado</Badge>
    return <Badge variant="outline" className="text-[10px]">{evento.estatus}</Badge>
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
              <Button
                className="mt-4 gap-2 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => {
                  onOpenChange(false)
                  router.push("/cotizarevento")
                }}
              >
                <Plus className="h-4 w-4" />
                Cotizar este salon
              </Button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 px-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">{eventos.length} evento{eventos.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{Object.keys(eventosPorHotel).length} hotel{Object.keys(eventosPorHotel).length !== 1 ? "es" : ""}</span>
                </div>
              </div>

              <Separator />

              {/* Events grouped by hotel */}
              {Object.entries(eventosPorHotel).map(([hotelName, hotelEventos]) => (
                <div key={hotelName} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Building2 className="h-4 w-4 text-lime-600" />
                    <h3 className="text-sm font-bold">{hotelName}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {hotelEventos.length}
                    </Badge>
                  </div>

                  {hotelEventos.map((evento) => (
                    <Card
                      key={`${evento.tipo}-${evento.id}`}
                      className={`border-l-4 ${getStatusColor(evento)} cursor-pointer transition-all hover:shadow-md`}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate">
                              {evento.nombreevento}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Folio: {evento.folio}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(evento)}
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5"
                            >
                              {evento.tipo}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <DoorClosed className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{evento.salon}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{evento.cliente}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {evento.horainicio} - {evento.horafin}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{evento.montaje}</span>
                          </div>
                          {evento.numeroinvitados > 0 && (
                            <div className="flex items-center gap-1.5 col-span-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span>{evento.numeroinvitados} invitados</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {evento.notas && (
                          <p className="text-[10px] text-muted-foreground italic border-t pt-1.5 mt-1">
                            {evento.notas}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}

              <Separator />

              {/* Quick Action */}
              <div className="pt-2 pb-4">
                <Button
                  className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => {
                    onOpenChange(false)
                    router.push("/cotizarevento")
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Cotizar este salon
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
