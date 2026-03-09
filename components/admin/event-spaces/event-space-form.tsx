"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, Upload, ImageIcon, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listaDesplegableSalones } from "@/app/actions/salones"
import { imagenSubirFormData } from "@/app/actions/utilerias"
import type { ddlItem } from "@/types/common"

interface EventSpace {
  id?: string
  hotel_id: string
  name: string
  description?: string
  capacity_min?: number
  capacity_max?: number
  area_m2?: number
  longitud?: number
  ancho?: number
  altura?: number
  is_available: boolean
}

interface EventSpaceFormProps {
  eventSpace?: EventSpace
  hotelesList: ddlItem[]
}

export function EventSpaceForm({ eventSpace, hotelesList }: EventSpaceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventSpace>({
    hotel_id: eventSpace?.hotel_id || "",
    name: eventSpace?.name || "",
    description: eventSpace?.description || "",
    capacity_min: eventSpace?.capacity_min || undefined,
    capacity_max: eventSpace?.capacity_max || undefined,
    area_m2: eventSpace?.area_m2 || undefined,
    longitud: eventSpace?.longitud || undefined,
    ancho: eventSpace?.ancho || undefined,
    altura: eventSpace?.altura || undefined,
    is_available: eventSpace?.is_available ?? true,
  })

  // Estado combinado
  const [estaCombinado, setEstaCombinado] = useState(false)
  const [salonesCombList, setSalonesCombList] = useState<ddlItem[]>([])
  const [salonCombSelected, setSalonCombSelected] = useState("")
  const [salonesCombinados, setSalonesCombinados] = useState<{ id: string; nombre: string }[]>([])

  // Cargar salones del hotel seleccionado para combinación
  useEffect(() => {
    async function loadSalonesHotel() {
      if (formData.hotel_id && formData.hotel_id !== "") {
        const result = await listaDesplegableSalones(-1, "", Number(formData.hotel_id))
        if (result.success && result.data) {
          setSalonesCombList(result.data)
        } else {
          setSalonesCombList([])
        }
      } else {
        setSalonesCombList([])
      }
      setSalonCombSelected("")
    }
    loadSalonesHotel()
  }, [formData.hotel_id])

  const handleAgregarSalonCombinado = () => {
    if (!salonCombSelected || salonCombSelected === "") return
    // Evitar duplicados
    if (salonesCombinados.some((s) => s.id === salonCombSelected)) return
    const salonItem = salonesCombList.find((s) => s.value === salonCombSelected)
    if (salonItem) {
      setSalonesCombinados([...salonesCombinados, { id: salonItem.value, nombre: salonItem.text }])
      setSalonCombSelected("")
    }
  }

  const handleRemoverSalonCombinado = (id: string) => {
    setSalonesCombinados(salonesCombinados.filter((s) => s.id !== id))
  }

  // Estado fotografías - se guardan localmente como File y preview URL, se suben al crear el salón
  const [fotosFiles, setFotosFiles] = useState<{ file: File; preview: string }[]>([])

  const handleAgregarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no válido. Use JPG, PNG, WebP o GIF.")
      e.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen excede el tamaño máximo de 10MB.")
      e.target.value = ""
      return
    }

    const preview = URL.createObjectURL(file)
    setFotosFiles([...fotosFiles, { file, preview }])
    e.target.value = ""
  }

  const handleEliminarFoto = (index: number) => {
    URL.revokeObjectURL(fotosFiles[index].preview)
    setFotosFiles(fotosFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Obtener nombre del hotel para la ruta del bucket
      const hotelItem = hotelesList.find((h) => h.value === formData.hotel_id)
      const hotelNombre = hotelItem?.text || "hotel"
      const salonNombre = formData.name || "salon"

      // Ruta: Imagenes/Salones/[NombreHotel]/[NombreSalon]/
      const folderPath = `Imagenes/Salones/${hotelNombre}/${salonNombre}`

      // Subir fotos al bucket via FormData
      const uploadedUrls: string[] = []
      for (const foto of fotosFiles) {
        const fd = new FormData()
        fd.append("file", foto.file)
        fd.append("folder", folderPath)
        fd.append("name", salonNombre)
        const result = await imagenSubirFormData(fd)
        console.log("[v0] Upload result:", result)
        if (result.success && result.url) {
          uploadedUrls.push(result.url)
        }
      }
      console.log("[v0] All uploaded URLs:", uploadedUrls)

      // Preparar datos para insert en tabla salones
      const dataToSave: Record<string, any> = {
        hotelid: Number(formData.hotel_id),
        nombre: formData.name,
        descripcion: formData.description || null,
        capacidadminima: formData.capacity_min || null,
        capacidadmaxima: formData.capacity_max || null,
        aream2: formData.area_m2 || null,
        longitud: formData.longitud || null,
        ancho: formData.ancho || null,
        altura: formData.altura || null,
        fotos: uploadedUrls.length > 0 ? uploadedUrls : null,
        estacombinado: estaCombinado,
        salonid: salonesCombinados.length > 0
          ? salonesCombinados.map((s) => Number(s.id))
          : null,
        activo: formData.is_available,
      }

      console.log("[v0] dataToSave:", JSON.stringify(dataToSave, null, 2))

      const supabase = createClient()

      if (eventSpace?.id) {
        const { data, error: updateError } = await supabase
          .from("salones")
          .update(dataToSave)
          .eq("id", eventSpace.id)
          .select()

        console.log("[v0] Update result:", { data, error: updateError })
        if (updateError) {
          console.error("[v0] Update error detail:", updateError.message, updateError.details, updateError.hint)
          throw new Error(updateError.message)
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("salones")
          .insert(dataToSave)
          .select()

        console.log("[v0] Insert result:", { data, error: insertError })
        if (insertError) {
          console.error("[v0] Insert error detail:", insertError.message, insertError.details, insertError.hint)
          throw new Error(insertError.message)
        }
      }

      router.push("/salones")
      router.refresh()
    } catch (err: unknown) {
      console.error("[v0] Error saving event space:", err)
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
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Selecciona un hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotelesList.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.text}
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
            <Label>Capacidades</Label>
            <p className="text-xs text-muted-foreground">Ingrese la capacidad mínima y máxima del salón</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity_min" className="text-sm font-normal">
                  Capacidad Mínima
                </Label>
                <Input
                  id="capacity_min"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={formData.capacity_min || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_min: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_max" className="text-sm font-normal">
                  Capacidad Máxima
                </Label>
                <Input
                  id="capacity_max"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={formData.capacity_max || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity_max: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Dimensiones</Label>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="area_m2" className="text-sm font-normal">
                  Área (m²)
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="longitud" className="text-sm font-normal">
                  Longitud (m)
                </Label>
                <Input
                  id="longitud"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.longitud || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitud: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
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
                  placeholder="10.00"
                  value={formData.ancho || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ancho: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
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
                  placeholder="4.00"
                  value={formData.altura || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      altura: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Está Combinado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esta_combinado"
                checked={estaCombinado}
                onChange={(e) => {
                  setEstaCombinado(e.target.checked)
                  if (!e.target.checked) {
                    setSalonesCombinados([])
                    setSalonCombSelected("")
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="esta_combinado" className="font-normal cursor-pointer">
                Está combinado
              </Label>
            </div>

            {estaCombinado && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="flex items-end gap-2">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="salon_comb" className="text-sm font-normal">
                      Salón a combinar
                    </Label>
                    <Select
                      value={salonCombSelected}
                      onValueChange={setSalonCombSelected}
                      disabled={!formData.hotel_id}
                    >
                      <SelectTrigger id="salon_comb" className="w-72">
                        <SelectValue placeholder={!formData.hotel_id ? "Seleccione hotel primero" : "Seleccionar salón"} />
                      </SelectTrigger>
                      <SelectContent>
                        {salonesCombList
                          .filter((s) => !salonesCombinados.some((sc) => sc.id === s.value))
                          .map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.text}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1"
                    onClick={handleAgregarSalonCombinado}
                    disabled={!salonCombSelected}
                  >
                    <Plus className="h-3 w-3" />
                    Agregar
                  </Button>
                </div>

                {salonesCombinados.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salón Combinado</TableHead>
                        <TableHead className="w-16 text-center">Quitar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salonesCombinados.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm">{s.nombre}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoverSalonCombinado(s.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>

          {/* Fotografías */}
          <div className="space-y-3">
            <Label>Fotografías del Salón</Label>
            <p className="text-xs text-muted-foreground">Suba imágenes del salón (JPG, PNG, WebP - máx. 10MB cada una)</p>

            <div className="flex items-center gap-3">
              <Label
                htmlFor="foto-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm cursor-pointer transition-colors bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              >
                <Upload className="h-4 w-4" />
                Seleccionar imagen
              </Label>
              <input
                id="foto-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAgregarFoto}
              />
            </div>

            {fotosFiles.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {fotosFiles.map((foto, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border bg-gray-100">
                    <img
                      src={foto.preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleEliminarFoto(index)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-gray-400">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p className="text-sm">No hay fotografías cargadas</p>
              </div>
            )}
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
