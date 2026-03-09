"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { actualizarSalon } from "@/app/actions/salones"
import type { oSalon, oMontajeXSalon } from "@/types/salones"
import type { ddlItem } from "@/types/common"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MediaUpload } from "@/components/admin/salones/media-upload"
import { toast } from "sonner"
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Users,
  Ruler,
  Maximize2,
} from "lucide-react"
import Link from "next/link"

/* ==================================================
  Types
================================================== */
interface SalonEditFormProps {
  salon: oSalon
  hoteles: ddlItem[]
  montajes: oMontajeXSalon[]
}

/* ==================================================
  Helpers
================================================== */
function parseMediaArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string")
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === "string")
    } catch {
      if (value.startsWith("http")) return [value]
    }
  }
  return []
}

function parseEquipmentArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string")
  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === "string")
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed as Record<string, unknown>)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
      }
    } catch {
      return []
    }
  }
  return []
}

/* ==================================================
  Component
================================================== */
export function SalonEditForm({ salon, hoteles, montajes }: SalonEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nombre, setNombre] = useState(salon.nombre || "")
  const [hotelid, setHotelid] = useState(salon.hotelid?.toString() || "")
  const [descripcion, setDescripcion] = useState(salon.descripcion || "")
  const [longitud, setLongitud] = useState(salon.longitud?.toString() || "")
  const [ancho, setAncho] = useState(salon.ancho?.toString() || "")
  const [altura, setAltura] = useState(salon.altura?.toString() || "")
  const [aream2, setAream2] = useState(salon.aream2?.toString() || "")
  const [capacidadminima, setCapacidadminima] = useState(salon.capacidadminima?.toString() || "")
  const [capacidadmaxima, setCapacidadmaxima] = useState(salon.capacidadmaxima?.toString() || "")
  const [precioporhora, setPrecioporhora] = useState(salon.precioporhora?.toString() || "")
  const [preciopordia, setPreciopordia] = useState(salon.preciopordia?.toString() || "")

  // Equipment state
  const equipoItems = parseEquipmentArray(salon.equipoincluido)
  const [equipoList, setEquipoList] = useState<string[]>(equipoItems)
  const [nuevoEquipo, setNuevoEquipo] = useState("")

  // Media state - managed by MediaUpload component but we track URLs for form submit
  const [fotos, setFotos] = useState<string[]>(parseMediaArray(salon.fotos))
  const [videos, setVideos] = useState<string[]>(parseMediaArray(salon.videos))
  const [planos, setPlanos] = useState<string[]>(parseMediaArray(salon.planos))
  const [renders, setRenders] = useState<string[]>(parseMediaArray(salon.renders))

  const commonEquipment = [
    "Proyector",
    "Pantalla de Proyección",
    "Sistema de Audio",
    "Micrófono Inalámbrico",
    "WiFi de Alta Velocidad",
    "Aire Acondicionado",
    "Iluminación Profesional",
    "Pizarrón / Rotafolio",
    "Escenario",
    "Pista de Baile",
    "Acceso para Discapacitados",
    "Estacionamiento",
    "Conexiones Eléctricas",
    "Mesas Redondas",
    "Sillas Banqueteras",
    "Mantelería",
  ]

  const toggleEquipo = (item: string) => {
    if (equipoList.includes(item)) {
      setEquipoList(equipoList.filter((e) => e !== item))
    } else {
      setEquipoList([...equipoList, item])
    }
  }

  const addCustomEquipo = () => {
    const trimmed = nuevoEquipo.trim()
    if (trimmed && !equipoList.includes(trimmed)) {
      setEquipoList([...equipoList, trimmed])
      setNuevoEquipo("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("id", salon.id?.toString() || "")
      formData.append("hotelid", hotelid)
      formData.append("nombre", nombre)
      formData.append("descripcion", descripcion)
      formData.append("longitud", longitud || "0")
      formData.append("ancho", ancho || "0")
      formData.append("altura", altura || "0")
      formData.append("aream2", aream2 || "0")
      formData.append("capacidadminima", capacidadminima || "0")
      formData.append("capacidadmaxima", capacidadmaxima || "0")
      formData.append("precioporhora", precioporhora || "0")
      formData.append("preciopordia", preciopordia || "0")
      formData.append("fotos", fotos.length > 0 ? JSON.stringify(fotos) : "")
      formData.append("videos", videos.length > 0 ? JSON.stringify(videos) : "")
      formData.append("planos", planos.length > 0 ? JSON.stringify(planos) : "")
      formData.append("renders", renders.length > 0 ? JSON.stringify(renders) : "")
      formData.append("equipoincluido", equipoList.length > 0 ? JSON.stringify(equipoList) : "")

      const result = await actualizarSalon(formData)

      if (result.success) {
        toast.success("Salón actualizado correctamente")
        router.push(`/salones/${salon.id}`)
        router.refresh()
      } else {
        setError(result.error || "Error al actualizar el salón")
        toast.error(result.error || "Error al actualizar el salón")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el salón"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/salones/${salon.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar: {salon.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {salon.hotel} &mdash; Modifica la información del salón
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="media">Fotos y Media</TabsTrigger>
          <TabsTrigger value="montajes">Montajes</TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="general">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos del Salón</CardTitle>
                <CardDescription>
                  Los campos marcados con * son obligatorios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hotel */}
                <div className="space-y-2">
                  <Label htmlFor="hotelid">Hotel *</Label>
                  <Select
                    required
                    value={hotelid}
                    onValueChange={setHotelid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hoteles.map((hotel) => (
                        <SelectItem key={hotel.value} value={hotel.value}>
                          {hotel.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Salón *</Label>
                  <Input
                    id="nombre"
                    required
                    placeholder="Salón Principal"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Descripción del salón, ubicación, características especiales..."
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                {/* Dimensions */}
                <div className="space-y-3">
                  <Label>Dimensiones</Label>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="longitud" className="text-sm font-normal">
                        Longitud (m)
                      </Label>
                      <Input
                        id="longitud"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="20"
                        value={longitud}
                        onChange={(e) => setLongitud(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ancho" className="text-sm font-normal">
                        Ancho (m)
                      </Label>
                      <Input
                        id="ancho"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="15"
                        value={ancho}
                        onChange={(e) => setAncho(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura" className="text-sm font-normal">
                        Altura (m)
                      </Label>
                      <Input
                        id="altura"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="4"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aream2" className="text-sm font-normal">
                        Área (m²)
                      </Label>
                      <Input
                        id="aream2"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="300"
                        value={aream2}
                        onChange={(e) => setAream2(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-3">
                  <Label>Capacidad</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="capacidadminima" className="text-sm font-normal">
                        Capacidad mínima (personas)
                      </Label>
                      <Input
                        id="capacidadminima"
                        type="number"
                        min="0"
                        placeholder="50"
                        value={capacidadminima}
                        onChange={(e) => setCapacidadminima(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacidadmaxima" className="text-sm font-normal">
                        Capacidad máxima (personas)
                      </Label>
                      <Input
                        id="capacidadmaxima"
                        type="number"
                        min="0"
                        placeholder="300"
                        value={capacidadmaxima}
                        onChange={(e) => setCapacidadmaxima(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <Label>Precios</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="precioporhora" className="text-sm font-normal">
                        Precio por hora (MXN)
                      </Label>
                      <Input
                        id="precioporhora"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="5000"
                        value={precioporhora}
                        onChange={(e) => setPrecioporhora(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preciopordia" className="text-sm font-normal">
                        Precio por día (MXN)
                      </Label>
                      <Input
                        id="preciopordia"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="25000"
                        value={preciopordia}
                        onChange={(e) => setPreciopordia(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-3">
                  <Label>Equipo Incluido</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {commonEquipment.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`equipo-${item}`}
                          checked={equipoList.includes(item)}
                          onChange={() => toggleEquipo(item)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <Label htmlFor={`equipo-${item}`} className="font-normal cursor-pointer">
                          {item}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {/* Custom equipment */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Agregar equipo personalizado..."
                      value={nuevoEquipo}
                      onChange={(e) => setNuevoEquipo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomEquipo()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomEquipo}>
                      Agregar
                    </Button>
                  </div>
                  {/* Show custom items (not in commonEquipment) */}
                  {equipoList.filter((e) => !commonEquipment.includes(e)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {equipoList
                        .filter((e) => !commonEquipment.includes(e))
                        .map((item) => (
                          <Badge key={item} variant="secondary" className="gap-1">
                            {item}
                            <button
                              type="button"
                              onClick={() => toggleEquipo(item)}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              &times;
                            </button>
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="bg-foreground text-background hover:bg-foreground/90">
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push(`/salones/${salon.id}`)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab: Fotos y Media */}
        <TabsContent value="media">
          <div className="space-y-6">
            <MediaUpload
              salonId={salon.id!}
              mediaType="fotos"
              currentFiles={fotos}
              onFilesChange={setFotos}
              title="Fotografías del Salón"
              description="Sube fotos del salón. JPG, PNG, WEBP. Max 10MB cada una."
              maxFiles={30}
            />

            <MediaUpload
              salonId={salon.id!}
              mediaType="videos"
              currentFiles={videos}
              onFilesChange={setVideos}
              title="Videos del Salón"
              description="Sube videos del salón. MP4, WebM. Max 50MB cada uno."
              maxFiles={5}
            />

            <MediaUpload
              salonId={salon.id!}
              mediaType="planos"
              currentFiles={planos}
              onFilesChange={setPlanos}
              title="Planos del Salón"
              description="Sube planos o layout. PDF, JPG, PNG. Max 10MB cada uno."
              maxFiles={10}
            />

            <MediaUpload
              salonId={salon.id!}
              mediaType="renders"
              currentFiles={renders}
              onFilesChange={setRenders}
              title="Renders 3D"
              description="Sube renders 3D del salón. JPG, PNG, WEBP. Max 10MB cada uno."
              maxFiles={10}
            />
          </div>
        </TabsContent>

        {/* Tab: Montajes */}
        <TabsContent value="montajes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Montajes Asignados</CardTitle>
              <CardDescription>
                Montajes disponibles para este salón con sus capacidades específicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {montajes.length > 0 ? (
                <div className="space-y-4">
                  {montajes.map((montaje, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      {/* Montaje image thumbnail */}
                      {montaje.fotos && parseMediaArray(montaje.fotos).length > 0 && (
                        <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-md">
                          <img
                            src={parseMediaArray(montaje.fotos)[0]}
                            alt={montaje.montaje || "Montaje"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {montaje.montaje || "Sin nombre"}
                          </h4>
                          {montaje.activo && (
                            <Badge className="bg-lime-600 text-[10px]">Activo</Badge>
                          )}
                        </div>
                        {montaje.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {montaje.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {(montaje.capacidadminima || montaje.capacidadmaxima) && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {montaje.capacidadminima || 0} — {montaje.capacidadmaxima || 0}
                            </span>
                          </div>
                        )}
                        {montaje.m2 && (
                          <div className="flex items-center gap-1">
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>{montaje.m2} m²</span>
                          </div>
                        )}
                        {(montaje.longitud || montaje.ancho) && (
                          <div className="flex items-center gap-1">
                            <Ruler className="h-3.5 w-3.5" />
                            <span>
                              {montaje.longitud || "—"}x{montaje.ancho || "—"}x{montaje.altura || "—"}m
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay montajes asignados a este salón.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Los montajes se administran desde la sección de configuración de montajes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
