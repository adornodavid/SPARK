"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"

interface AgreementsFilterProps {
  filters: {
    status: string
    hotel_id: string
    search: string
  }
  onFiltersChange: (filters: any) => void
}

export function AgreementsFilter({ filters, onFiltersChange }: AgreementsFilterProps) {
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
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
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
        </div>
      </CardContent>
    </Card>
  )
}
