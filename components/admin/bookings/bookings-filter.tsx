"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

interface BookingsFilterProps {
  filters: {
    status: string
    hotel_id: string
    date_from: string
    date_to: string
  }
  onFiltersChange: (filters: any) => void
}

export function BookingsFilter({ filters, onFiltersChange }: BookingsFilterProps) {
  const [hotels, setHotels] = useState<any[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    loadHotels()
  }, [])

  async function loadHotels() {
    const { data } = await supabase.from("hotels").select("id, name").eq("status", "active").order("name")

    if (data) setHotels(data)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="checked_in">Check-in</SelectItem>
                <SelectItem value="checked_out">Check-out</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hotel</Label>
            <Select
              value={filters.hotel_id}
              onValueChange={(value) => onFiltersChange({ ...filters, hotel_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los hoteles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hoteles</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Desde</Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
