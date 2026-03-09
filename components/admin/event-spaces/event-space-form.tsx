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

interface EventSpace {
  id?: string
  hotel_id: string
  name: string
  description?: string
  capacity_theater?: number
  capacity_banquet?: number
  capacity_cocktail?: number
  capacity_classroom?: number
  area_m2?: number
  amenities?: Record<string, unknown>
  is_available: boolean
  photos?: Record<string, unknown>
}

interface EventSpaceFormProps {
  eventSpace?: EventSpace
  hotels: Hotel[]
}

export function EventSpaceForm({ eventSpace, hotels }: EventSpaceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventSpace>({
    hotel_id: eventSpace?.hotel_id || "",
    name: eventSpace?.name || "",
    description: eventSpace?.description || "",
    capacity_theater: eventSpace?.capacity_theater || undefined,
    capacity_banquet: eventSpace?.capacity_banquet || undefined,
    capacity_cocktail: eventSpace?.capacity_cocktail || undefined,
    capacity_classroom: eventSpace?.capacity_classroom || undefined,
    area_m2: eventSpace?.area_m2 || undefined,
    amenities: eventSpace?.amenities || {},
    is_available: eventSpace?.is_available ?? true,
    photos: eventSpace?.photos || {},
  })

  const [amenitiesList, setAmenitiesList] = useState<string[]>(
    eventSpace?.amenities ? Object.keys(eventSpace.amenities) : [],
  )

  const commonAmenities = [
    "Proyector",
    "Pantalla",
    "Sistema de Audio",
    "Micrófono Inalámbrico",
    "WiFi de Alta Velocidad",
    "Aire Acondicionado",
    "Iluminación Profesional",
    "Pizarrón",
    "Escenario",
    "Pista de Baile",
    "Acceso para Discapacitados",
    "Estacionamiento",
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
        capacity_theater: formData.capacity_theater || null,
        capacity_banquet: formData.capacity_banquet || null,
        capacity_cocktail: formData.capacity_cocktail || null,
        capacity_classroom: formData.capacity_classroom || null,
        area_m2: formData.area_m2 || null,
        amenities: Object.keys(formData.amenities || {}).length > 0 ? formData.amenities : null,
        photos: null, // Will be handled separately when image upload is implemented
      }

      if (eventSpace?.id) {
        const { error: updateError } = await supabase.from("event_spaces").update(dataToSave).eq("id", eventSpace.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("event_spaces").insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push("/salones")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el salón")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Salón de Eventos</CardTitle>
          <CardDescription>Complete los datos del salón. Los campos marcados con * son obligatorios.</CardDescription>
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
            <Label htmlFor="name">Nombre del Salón *</Label>
            <Input
              id="name"
              required
              placeholder="Salón Principal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del salón, ubicación, características especiales..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Capacidades por Tipo de Montaje</Label>
            <p className="text-xs text-muted-foreground">Ingrese la capacidad máxima según el tipo de evento</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity_banquet" className="text-sm font-normal">
                  Banquete (personas sentadas)
                </Label>
                <Input
                  id="capacity_banquet"
                  type="number"
                  min="0"
                  placeholder="150"
                  value={formData.capacity_banquet || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_banquet: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_theater" className="text-sm font-normal">
                  Teatro (butacas)
                </Label>
                <Input
                  id="capacity_theater"
                  type="number"
                  min="0"
                  placeholder="200"
                  value={formData.capacity_theater || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_theater: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_classroom" className="text-sm font-normal">
                  Aula / Escuela
                </Label>
                <Input
                  id="capacity_classroom"
                  type="number"
                  min="0"
                  placeholder="80"
                  value={formData.capacity_classroom || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_classroom: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_cocktail" className="text-sm font-normal">
                  Cóctel (de pie)
                </Label>
                <Input
                  id="capacity_cocktail"
                  type="number"
                  min="0"
                  placeholder="250"
                  value={formData.capacity_cocktail || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_cocktail: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_m2">Área (m²)</Label>
            <Input
              id="area_m2"
              type="number"
              min="0"
              step="0.01"
              placeholder="250.50"
              value={formData.area_m2 || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  area_m2: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Amenidades y Equipamiento</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {commonAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={amenity}
                    checked={amenitiesList.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor={amenity} className="font-normal cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="is_available" className="font-normal cursor-pointer">
              Salón disponible para eventos
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
              {isLoading ? "Guardando..." : eventSpace?.id ? "Actualizar Salón" : "Crear Salón"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/salones")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
