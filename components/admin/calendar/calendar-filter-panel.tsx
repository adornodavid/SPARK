"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building2, DoorClosed, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"

interface CalendarFilterPanelProps {
  selectedHotel: string
  selectedSalon: string
  onHotelChange: (value: string) => void
  onSalonChange: (value: string) => void
  filters: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }
  onFiltersChange: (filters: {
    tentativo: boolean
    definitivo: boolean
    cancelado: boolean
  }) => void
  userHoteles: string // Comma-separated hotel IDs from session
  hideAllHotels?: boolean // Si true oculta opción "Todos los hoteles" (vista Disponibilidad)
  onDateSelect?: (date: string) => void // Abre la vista de día para la fecha seleccionada
}

export default function CalendarFilterPanel({
  selectedHotel,
  selectedSalon,
  onHotelChange,
  onSalonChange,
  filters,
  onFiltersChange,
  userHoteles,
  hideAllHotels = false,
  onDateSelect,
}: CalendarFilterPanelProps) {
  const [hotelesList, setHotelesList] = useState<{ value: string; text: string }[]>([])
  const [salonesList, setSalonesList] = useState<{ value: string; text: string }[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")

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

  // Cargar salones por hotelid via API route
  useEffect(() => {
    const hotelId = selectedHotel === "all" ? "-1" : selectedHotel
    fetch(`/api/salones?hotelid=${hotelId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setSalonesList(result.data)
        } else {
          setSalonesList([])
        }
      })
      .catch((err) => {
        console.error("[SALON] Error fetch:", err)
        setSalonesList([])
      })
  }, [selectedHotel])

  // onHotelChange en el dashboard ya resetea salon e incluye los updateUrlParams,
  // evitamos encadenar onSalonChange aquí para no disparar re-renders duplicados.
  const handleHotelChange = (value: string) => {
    onHotelChange(value)
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
                {!hideAllHotels && (
                  <SelectItem value="all">
                    <span className="font-semibold">Todos los hoteles</span>
                  </SelectItem>
                )}
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

        {/* Status Filters + Date Picker */}
        <div className="mt-6 pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">Filtrar por estatus comercial:</Label>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tentativo"
                checked={filters.tentativo}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, tentativo: checked as boolean })
                }
              />
              <label
                htmlFor="tentativo"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                Tentativo
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="definitivo"
                checked={filters.definitivo}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, definitivo: checked as boolean })
                }
              />
              <label
                htmlFor="definitivo"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                Definitivo
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cancelado"
                checked={filters.cancelado}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, cancelado: checked as boolean })
                }
              />
              <label
                htmlFor="cancelado"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-700"></span>
                Cancelado
              </label>
            </div>

            {/* Date Picker — abre la vista de día al seleccionar */}
            <div className="flex items-center gap-2 ml-8 pl-8 border-l">
              <Label htmlFor="filter-date" className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Buscar por Fecha
              </Label>
              <Input
                id="filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedDate(value)
                  if (value && onDateSelect) {
                    onDateSelect(value)
                  }
                }}
                className="h-8 w-40 border-blue-300 bg-blue-50/50 text-blue-900 focus-visible:ring-blue-400 hover:bg-blue-50"
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
