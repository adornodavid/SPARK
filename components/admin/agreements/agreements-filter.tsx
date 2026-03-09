"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import type { ddlItem } from "@/types/common"

interface AgreementsFilterProps {
  filters: {
    estado: string
    hotelid: number
    busqueda: string
  }
  onFiltersChange: (filters: { estado: string; hotelid: number; busqueda: string }) => void
}

export function AgreementsFilter({ filters, onFiltersChange }: AgreementsFilterProps) {
  const [hoteles, setHoteles] = useState<ddlItem[]>([])

  useEffect(() => {
    async function loadHoteles() {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHoteles(result.data as ddlItem[])
      }
    }
    loadHoteles()
  }, [])

  const hasActiveFilters = filters.estado !== "" || filters.hotelid !== -1 || filters.busqueda !== ""

  function clearFilters() {
    onFiltersChange({ estado: "", hotelid: -1, busqueda: "" })
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Busqueda */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Empresa, contacto, email..."
              value={filters.busqueda}
              onChange={(e) => onFiltersChange({ ...filters, busqueda: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Estado</Label>
          <Select
            value={filters.estado || "todos"}
            onValueChange={(value) => onFiltersChange({ ...filters, estado: value === "todos" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hotel */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Hotel</Label>
          <Select
            value={filters.hotelid === -1 ? "todos" : filters.hotelid.toString()}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, hotelid: value === "todos" ? -1 : Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los hoteles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los hoteles</SelectItem>
              {hoteles.map((hotel) => (
                <SelectItem key={hotel.value} value={hotel.value}>
                  {hotel.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="h-9">
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
