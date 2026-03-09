"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building2, DoorClosed } from "lucide-react"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones } from "@/app/actions/salones"

interface CalendarFilterPanelProps {
  selectedHotel: string
  selectedSalon: string
  onHotelChange: (value: string) => void
  onSalonChange: (value: string) => void
  filters: {
    cotizaciones: boolean
    reservaciones: boolean
    canceladas: boolean
    confirmadas: boolean
    pendientes: boolean
  }
  onFiltersChange: (filters: {
    cotizaciones: boolean
    reservaciones: boolean
    canceladas: boolean
    confirmadas: boolean
    pendientes: boolean
  }) => void
  userHoteles: string // Comma-separated hotel IDs from session
}

export default function CalendarFilterPanel({
  selectedHotel,
  selectedSalon,
  onHotelChange,
  onSalonChange,
  filters,
  onFiltersChange,
  userHoteles,
}: CalendarFilterPanelProps) {
  const [hotelesList, setHotelesList] = useState<{ value: string; text: string }[]>([])
  const [salonesList, setSalonesList] = useState<{ value: string; text: string }[]>([])

  // Parse user's assigned hotel IDs
  const userHotelIds = userHoteles
    ? userHoteles
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    : []

  // Load hotels dropdown
  useEffect(() => {
    const fetchHoteles = async () => {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHotelesList(result.data)
      }
    }
    fetchHoteles()
  }, [])

  // Load salones dropdown - cascading based on selected hotel
  useEffect(() => {
    const fetchSalones = async () => {
      const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
      const result = await listaDesplegableSalones(-1, "", hotelId)
      if (result.success && result.data) {
        setSalonesList(result.data)
      }
    }
    fetchSalones()
  }, [selectedHotel])

  // Reset salon when hotel changes
  const handleHotelChange = (value: string) => {
    onHotelChange(value)
    onSalonChange("all")
  }

  return (
    <Card className="gap-3 py-3 rounded-xl border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Filtros Multipropiedad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hotel Selector */}
          <div className="space-y-2">
            <Label htmlFor="hotel" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Hotel
            </Label>
            <Select value={selectedHotel} onValueChange={handleHotelChange}>
              <SelectTrigger id="hotel" className="w-full">
                <SelectValue placeholder="Seleccionar hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-semibold">Todos los hoteles</span>
                </SelectItem>
                {hotelesList.map((hotel) => {
                  const isAssigned = userHotelIds.includes(hotel.value)
                  return (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      <span className="flex items-center gap-2">
                        {hotel.text}
                        {isAssigned && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 border-lime-500 text-lime-700 bg-lime-50"
                          >
                            Mi hotel
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Salon Selector - Cascading */}
          <div className="space-y-2">
            <Label htmlFor="salon" className="flex items-center gap-1.5">
              <DoorClosed className="h-3.5 w-3.5" />
              Salon
            </Label>
            <Select value={selectedSalon} onValueChange={onSalonChange}>
              <SelectTrigger id="salon" className="w-full">
                <SelectValue placeholder="Seleccionar salon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los salones</SelectItem>
                {salonesList.map((salon) => (
                  <SelectItem key={salon.value} value={salon.value}>
                    {salon.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedHotel === "all" && (
              <p className="text-[10px] text-muted-foreground">
                Selecciona un hotel para filtrar salones
              </p>
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-6 pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">Filtrar por tipo y estatus:</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cotizaciones"
                checked={filters.cotizaciones}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, cotizaciones: checked as boolean })
                }
              />
              <label
                htmlFor="cotizaciones"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Cotizaciones
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reservaciones"
                checked={filters.reservaciones}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, reservaciones: checked as boolean })
                }
              />
              <label
                htmlFor="reservaciones"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Reservaciones
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmadas"
                checked={filters.confirmadas}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, confirmadas: checked as boolean })
                }
              />
              <label
                htmlFor="confirmadas"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
                Confirmadas
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pendientes"
                checked={filters.pendientes}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, pendientes: checked as boolean })
                }
              />
              <label
                htmlFor="pendientes"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                Pendientes
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canceladas"
                checked={filters.canceladas}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, canceladas: checked as boolean })
                }
              />
              <label
                htmlFor="canceladas"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                Canceladas
              </label>
            </div>
          </div>
        </div>

        {/* Legend - Color coding per spec */}
        <div className="mt-4 pt-3 border-t">
          <Label className="text-xs font-semibold mb-2 block text-muted-foreground">Leyenda de colores:</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-lime-500"></div>
              <span className="text-xs text-muted-foreground">Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-400"></div>
              <span className="text-xs text-muted-foreground">Cotizado / Apartado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-xs text-muted-foreground">Confirmado / Pagado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-400"></div>
              <span className="text-xs text-muted-foreground">Realizado / Cancelado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
