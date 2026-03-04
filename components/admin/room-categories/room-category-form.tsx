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
  id?: string
  hotel_id: string
  name: string
  description?: string
  max_occupancy: number
  amenities?: Record<string, unknown>
}

interface RoomCategoryFormProps {
  category?: RoomCategory
  hotels: Hotel[]
}

export function RoomCategoryForm({ category, hotels }: RoomCategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<RoomCategory>({
    hotel_id: category?.hotel_id || "",
    name: category?.name || "",
    description: category?.description || "",
    max_occupancy: category?.max_occupancy || 2,
    amenities: category?.amenities || {},
  })

  const [amenitiesList, setAmenitiesList] = useState<string[]>(
    category?.amenities ? Object.keys(category.amenities) : [],
  )

  const commonAmenities = [
    "WiFi Gratis",
    "TV por Cable",
    "Aire Acondicionado",
    "Minibar",
    "Caja de Seguridad",
    "Cafetera",
    "Secadora de Pelo",
    "Plancha y Tabla",
    "Escritorio de Trabajo",
    "Balcón o Terraza",
    "Baño Privado",
    "Servicio a Habitación",
  ]

  const toggleAmenity = (amenity: string) => {
    if (amenitiesList.includes(amenity)) {
      const newList = amenitiesList.filter((a) => a !== amenity)
      setAmenitiesList(newList)
      const newAmenities = { ...formData.amenities }
      delete newAmenities[amenity]
      setFormData({ ...formData, amenities: newAmenities })
    } else {
      setAmenitiesList([...amenitiesList, amenity])
      setFormData({
        ...formData,
        amenities: { ...formData.amenities, [amenity]: true },
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const dataToSave = {
        ...formData,
        description: formData.description || null,
        amenities: Object.keys(formData.amenities || {}).length > 0 ? formData.amenities : null,
      }

      if (category?.id) {
        const { error: updateError } = await supabase.from("room_categories").update(dataToSave).eq("id", category.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("room_categories").insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push("/admin/room-categories")
      router.refresh()
    } catch (err: unknown) {
      console.error("[v0] Error saving room category:", err)
      setError(err instanceof Error ? err.message : "Error al guardar la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Categoría</CardTitle>
          <CardDescription>
            Define las características de este tipo de habitación. Los campos marcados con * son obligatorios.
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
            <Label htmlFor="name">Nombre de la Categoría *</Label>
            <Input
              id="name"
              required
              placeholder="Habitación Estándar, Suite Junior, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Ejemplo: Estándar, Deluxe, Suite Junior, Master Suite</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe las características principales de esta categoría..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Ocupación Máxima *</Label>
            <Input
              id="max_occupancy"
              type="number"
              required
              min="1"
              placeholder="2"
              value={formData.max_occupancy}
              onChange={(e) => setFormData({ ...formData, max_occupancy: Number.parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de personas que pueden hospedarse en esta categoría
            </p>
          </div>

          <div className="space-y-3">
            <Label>Amenidades Incluidas</Label>
            <p className="text-xs text-muted-foreground">
              Selecciona las amenidades que incluye esta categoría de habitación
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {commonAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={amenity}
                    checked={amenitiesList.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={amenity} className="font-normal cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : category?.id ? "Actualizar Categoría" : "Crear Categoría"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/room-categories")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
