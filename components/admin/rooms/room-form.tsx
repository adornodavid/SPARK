"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { crearHabitacion, actualizarHabitacion } from "@/app/actions/habitaciones"
import { ESTADOS_HABITACION } from "@/types/habitaciones"
import type { oHabitacionDetalle, EstadoHabitacion, ddlHotel, ddlCategoria } from "@/types/habitaciones"
import Link from "next/link"

interface RoomFormProps {
  room?: oHabitacionDetalle | null
  hotels: ddlHotel[]
  categories: ddlCategoria[]
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

export function RoomForm({ room, hotels, categories }: RoomFormProps) {
  const router = useRouter()
  const isEditing = !!room?.id
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hotelId, setHotelId] = useState(room?.hotel_id || "")
  const [categoryId, setCategoryId] = useState(room?.category_id || "")
  const [roomNumber, setRoomNumber] = useState(room?.room_number || "")
  const [floor, setFloor] = useState<string>(room?.floor !== null && room?.floor !== undefined ? String(room.floor) : "")
  const [status, setStatus] = useState<EstadoHabitacion>(room?.status || "disponible")
  const [capacity, setCapacity] = useState<string>(room?.capacity ? String(room.capacity) : "")
  const [rackPrice, setRackPrice] = useState<string>(room?.rack_price ? String(room.rack_price) : "")
  const [description, setDescription] = useState(room?.description || "")
  const [notes, setNotes] = useState(room?.notes || "")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(parseAmenities(room?.amenities))

  // Filter categories by selected hotel
  const filteredCategories = useMemo(() => {
    if (!hotelId) return categories
    return categories.filter((c) => c.hotel_id === hotelId)
  }, [categories, hotelId])

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
      category_id: categoryId,
      room_number: roomNumber,
      floor: floor ? parseInt(floor) : null,
      status,
      capacity: capacity ? parseInt(capacity) : null,
      rack_price: rackPrice ? parseFloat(rackPrice) : null,
      description,
      amenities: selectedAmenities,
      notes,
    }

    try {
      if (isEditing && room?.id) {
        const result = await actualizarHabitacion(room.id, formData)
        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
        } else {
          toast.success("Habitacion actualizada correctamente")
          router.push("/habitaciones")
          router.refresh()
        }
      } else {
        const result = await crearHabitacion(formData)
        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
        } else {
          toast.success("Habitacion creada correctamente")
          router.push("/habitaciones")
          router.refresh()
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la habitacion"
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
          <Link href="/habitaciones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Editar Habitacion" : "Nueva Habitacion"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? `Modificando habitacion ${room?.room_number} - ${room?.hotel?.name || ""}`
              : "Registra una nueva habitacion en el sistema"}
          </p>
        </div>
      </div>

      {/* Informacion General */}
      <div className="spark-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Informacion General</h2>
          <p className="text-sm text-muted-foreground">Datos basicos de la habitacion. Los campos con * son obligatorios.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hotel_id">Hotel *</Label>
            <Select
              required
              value={hotelId}
              onValueChange={(value) => {
                setHotelId(value)
                setCategoryId("")
              }}
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
            <Label htmlFor="category_id">Categoria *</Label>
            <Select
              required
              value={categoryId}
              onValueChange={setCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={hotelId ? "Selecciona una categoria" : "Selecciona hotel primero"} />
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
              Las categorias definen el tipo y amenidades base de la habitacion
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="room_number">Numero de Habitacion *</Label>
            <Input
              id="room_number"
              required
              placeholder="101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Piso</Label>
            <Input
              id="floor"
              type="number"
              min="0"
              max="100"
              placeholder="1"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EstadoHabitacion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_HABITACION.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad (personas)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              placeholder="2"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rack_price">Precio Rack (MXN)</Label>
            <Input
              id="rack_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="1500.00"
              value={rackPrice}
              onChange={(e) => setRackPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            placeholder="Describe las caracteristicas principales de la habitacion..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas internas</Label>
          <Textarea
            id="notes"
            placeholder="Notas para el equipo (ej: necesita reparacion, tiene vista al mar, etc.)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Amenidades */}
      <div className="spark-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Amenidades</h2>
          <p className="text-sm text-muted-foreground">
            Selecciona las amenidades especificas de esta habitacion (adicionales a las de la categoria)
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
              {isEditing ? "Actualizar Habitacion" : "Crear Habitacion"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/habitaciones")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
