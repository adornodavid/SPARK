"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones } from "@/app/actions/salones"
import type { ddlItem } from "@/types/common"

interface QuotationsFilterProps {
  filters: {
    status: string
    hotel_id: string
    salon_id: string
    search: string
  }
  onFiltersChange: (filters: any) => void
}

export function QuotationsFilter({ filters, onFiltersChange }: QuotationsFilterProps) {
  const [hotels, setHotels] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])

  useEffect(() => {
    async function loadHotels() {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHotels(result.data)
      }
    }
    loadHotels()
  }, [])

  useEffect(() => {
    async function loadSalones() {
      const hotelId = filters.hotel_id && filters.hotel_id !== "" && filters.hotel_id !== "all" ? Number(filters.hotel_id) : -1
      const result = await listaDesplegableSalones(-1, "", hotelId)
      if (result.success && result.data) {
        setSalones(result.data)
      }
    }
    loadSalones()
  }, [filters.hotel_id])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <div className="w-[180px] space-y-2">
            <Label>Buscar por Folio</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-[220px] space-y-2">
            <Label>Hotel</Label>
            <Select
              value={filters.hotel_id}
              onValueChange={(value) => onFiltersChange({ ...filters, hotel_id: value, salon_id: "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los hoteles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hoteles</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.value} value={hotel.value}>
                    {hotel.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[220px] space-y-2">
            <Label>Salon</Label>
            <Select
              value={filters.salon_id}
              onValueChange={(value) => onFiltersChange({ ...filters, salon_id: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los salones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los salones</SelectItem>
                {salones.map((salon) => (
                  <SelectItem key={salon.value} value={salon.value}>
                    {salon.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px] space-y-2">
            <Label>Estado</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
