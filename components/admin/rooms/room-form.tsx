"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Hotel {
  id: string
  code: string
  name: string
}

interface RoomCategory {
  id: string
  name: string
}

interface Room {
  id?: string
  hotel_id: string
  category_id: string
  room_number: string
  floor?: number
  is_available: boolean
  notes?: string
}

interface RoomFormProps {
  room?: Room
  hotels: Hotel[]
  categories: RoomCategory[]
}

export function RoomForm({ room, hotels, categories }: RoomFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Room>({
    hotel_id: room?.hotel_id || "",
    category_id: room?.category_id || "",
    room_number: room?.room_number || "",
    floor: room?.floor || undefined,
    is_available: room?.is_available ?? true,
    notes: room?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const dataToSave = {
        ...formData,
        floor: formData.floor || null,
        notes: formData.notes || null,
      }

      if (room?.id) {
        const { error: updateError } = await supabase.from("rooms").update(dataToSave).eq("id", room.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("rooms").insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push("/habitaciones")
      router.refresh()
    } catch (err: unknown) {
      console.error("[v0] Error saving room:", err)
      setError(err instanceof Error ? err.message : "Error al guardar la habitación")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter categories by selected hotel
  const filteredCategories = categories.filter((cat) => {
    // In real implementation, you'd filter by hotel_id from category
    return true
  })

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Habitación</CardTitle>
          <CardDescription>
            Complete los datos de la habitación. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hotel_id">Hotel *</Label>
            <Select
              required
              value={formData.hotel_id}
              onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name} ({hotel.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Categoría de Habitación *</Label>
            <Select
              required
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Las categorías definen el tipo y amenidades de la habitación
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room_number">Número de Habitación *</Label>
              <Input
                id="room_number"
                required
                placeholder="101"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Piso</Label>
              <Input
                id="floor"
                type="number"
                min="0"
                placeholder="1"
                value={formData.floor || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    floor: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre la habitación (ej: tiene vista al mar, necesita mantenimiento, etc.)"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_available" className="font-normal cursor-pointer">
              Habitación disponible para reservas
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : room?.id ? "Actualizar Habitación" : "Crear Habitación"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/habitaciones")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
