"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { crearCategoriaHabitacion, actualizarCategoriaHabitacion } from "@/app/actions/habitaciones"
import type { oCategoriaHabitacionDetalle, ddlHotel } from "@/types/habitaciones"
import Link from "next/link"

interface RoomCategoryFormProps {
  category?: oCategoriaHabitacionDetalle | null
  hotels: ddlHotel[]
}

const COMMON_AMENITIES = [
  "WiFi Gratis",
  "TV por Cable",
  "Aire Acondicionado",
  "Minibar",
  "Caja de Seguridad",
  "Cafetera",
  "Secadora de Pelo",
  "Plancha y Tabla",
  "Escritorio de Trabajo",
  "Balcon o Terraza",
  "Bano Privado",
  "Servicio a Habitacion",
  "Telefono",
  "Vista al Mar",
  "Jacuzzi",
  "Sala de Estar",
  "Room Service 24h",
  "Desayuno Incluido",
]

function parseAmenities(amenities: unknown): string[] {
  if (!amenities) return []
  if (Array.isArray(amenities)) return amenities as string[]
  if (typeof amenities === "string") {
    try {
      const parsed = JSON.parse(amenities)
      if (Array.isArray(parsed)) return parsed
      if (typeof parsed === "object" && parsed !== null) return Object.keys(parsed)
    } catch {
      return []
    }
  }
  if (typeof amenities === "object" && amenities !== null) {
    return Object.keys(amenities as Record<string, unknown>)
  }
  return []
}

export function RoomCategoryForm({ category, hotels }: RoomCategoryFormProps) {
  const router = useRouter()
  const isEditing = !!category?.id
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hotelId, setHotelId] = useState(category?.hotel_id || "")
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [basePrice, setBasePrice] = useState<string>(category?.base_price ? String(category.base_price) : "")
  const [maxOccupancy, setMaxOccupancy] = useState<string>(category?.max_occupancy ? String(category.max_occupancy) : "2")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(parseAmenities(category?.amenities))

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = {
      hotel_id: hotelId,
      name,
      description,
      base_price: basePrice ? parseFloat(basePrice) : null,
      max_occupancy: maxOccupancy ? parseInt(maxOccupancy) : null,
      amenities: selectedAmenities,
    }

    try {
      if (isEditing && category?.id) {
        const result = await actualizarCategoriaHabitacion(category.id, formData)
        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
        } else {
          toast.success("Categoria actualizada correctamente")
          router.push("/room-categories")
          router.refresh()
        }
      } else {
        const result = await crearCategoriaHabitacion(formData)
        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
        } else {
          toast.success("Categoria creada correctamente")
          router.push("/room-categories")
          router.refresh()
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la categoria"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Link href="/room-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Editar Categoria" : "Nueva Categoria"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? `Modificando "${category?.name}" - ${category?.hotel?.name || ""}`
              : "Define una nueva categoria o tipo de habitacion"}
          </p>
        </div>
      </div>

      {/* Info General */}
      <div className="spark-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Informacion de la Categoria</h2>
          <p className="text-sm text-muted-foreground">
            Define las caracteristicas de este tipo de habitacion. Los campos con * son obligatorios.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotel_id">Hotel *</Label>
          <Select
            required
            value={hotelId}
            onValueChange={setHotelId}
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
          <Label htmlFor="name">Nombre de la Categoria *</Label>
          <Input
            id="name"
            required
            placeholder="Habitacion Estandar, Suite Junior, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Ejemplo: Estandar, Deluxe, Suite Junior, Master Suite</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            placeholder="Describe las caracteristicas principales de esta categoria..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="base_price">Precio Base (MXN)</Label>
            <Input
              id="base_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="1500.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Precio de referencia para esta categoria. Cada habitacion puede tener su propio precio rack.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Ocupacion Maxima *</Label>
            <Input
              id="max_occupancy"
              type="number"
              required
              min="1"
              max="20"
              placeholder="2"
              value={maxOccupancy}
              onChange={(e) => setMaxOccupancy(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Numero maximo de personas que pueden hospedarse
            </p>
          </div>
        </div>
      </div>

      {/* Amenidades */}
      <div className="spark-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Amenidades Incluidas</h2>
          <p className="text-sm text-muted-foreground">
            Selecciona las amenidades que incluye esta categoria de habitacion
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {COMMON_AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className={`flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                selectedAmenities.includes(amenity)
                  ? "border-foreground/30 bg-muted"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="h-4 w-4 rounded border-border accent-foreground"
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Actualizar Categoria" : "Crear Categoria"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/room-categories")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
