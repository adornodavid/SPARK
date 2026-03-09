"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  obtenerItemMenu,
  obtenerCategoriasDropdown,
  crearItemMenu,
  actualizarItemMenu,
} from "@/app/actions/menus"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { ALERGENOS_COMUNES } from "@/types/menus"
import type { ddlItem } from "@/types/common"

interface MenuItemFormProps {
  itemId?: string
}

export function MenuItemForm({ itemId }: MenuItemFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCategoria = searchParams.get("categoriaid")
  const isEditing = !!itemId
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditing)
  const [categorias, setCategorias] = useState<ddlItem[]>([])
  const [hoteles, setHoteles] = useState<ddlItem[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    categoriaid: preselectedCategoria || "",
    hotelid: "" as string,
    disponible: true,
    imagenurl: "",
    alergenos: [] as string[],
    orden: 0,
  })

  useEffect(() => {
    loadDropdowns()
    if (itemId) {
      loadItem(Number(itemId))
    }
  }, [itemId])

  async function loadDropdowns() {
    const [catResult, hotelResult] = await Promise.all([
      obtenerCategoriasDropdown(),
      listaDesplegableHoteles(),
    ])

    if (catResult.success && catResult.data) {
      setCategorias(catResult.data)
    }
    if (hotelResult.success && hotelResult.data) {
      setHoteles(hotelResult.data)
    }
  }

  async function loadItem(id: number) {
    setLoadingData(true)
    const result = await obtenerItemMenu(id)
    if (result.success && result.data) {
      setFormData({
        nombre: result.data.nombre || "",
        descripcion: result.data.descripcion || "",
        precio: result.data.precio || 0,
        categoriaid: result.data.categoriaid ? result.data.categoriaid.toString() : "",
        hotelid: result.data.hotelid ? result.data.hotelid.toString() : "",
        disponible: result.data.disponible ?? true,
        imagenurl: result.data.imagenurl || "",
        alergenos: result.data.alergenos || [],
        orden: result.data.orden || 0,
      })
    } else {
      toast.error(result.error || "Error cargando platillo")
      router.push("/menus")
    }
    setLoadingData(false)
  }

  function toggleAlergeno(alergeno: string) {
    setFormData((prev) => ({
      ...prev,
      alergenos: prev.alergenos.includes(alergeno)
        ? prev.alergenos.filter((a) => a !== alergeno)
        : [...prev.alergenos, alergeno],
    }))
  }

  function removeAlergeno(alergeno: string) {
    setFormData((prev) => ({
      ...prev,
      alergenos: prev.alergenos.filter((a) => a !== alergeno),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const datos = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        precio: formData.precio,
        categoriaid: Number(formData.categoriaid),
        hotelid: formData.hotelid ? Number(formData.hotelid) : null,
        disponible: formData.disponible,
        imagenurl: formData.imagenurl || null,
        alergenos: formData.alergenos.length > 0 ? formData.alergenos : null,
        orden: formData.orden || undefined,
      }

      if (isEditing) {
        const result = await actualizarItemMenu(Number(itemId), datos)
        if (result.success) {
          toast.success("Platillo actualizado correctamente")
          router.push("/menus")
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await crearItemMenu(datos)
        if (result.success) {
          toast.success("Platillo creado correctamente")
          router.push("/menus")
        } else {
          toast.error(result.error)
        }
      }
    } catch {
      toast.error("Error inesperado al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="spark-card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="spark-card p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <Link href="/menus">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold text-foreground">
              {isEditing ? "Editar Platillo" : "Nuevo Platillo"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Modifica la informacion del platillo"
                : "Agrega un nuevo platillo al menu"}
            </p>
          </div>
        </div>

        {/* Informacion basica */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Informacion basica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del platillo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Filete de res en salsa bordelesa"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoriaid">Categoria *</Label>
              <Select
                value={formData.categoriaid}
                onValueChange={(value) => setFormData({ ...formData, categoriaid: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe los ingredientes y preparacion del platillo..."
              rows={3}
            />
          </div>
        </div>

        {/* Precio y disponibilidad */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Precio y disponibilidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (MXN)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="precio"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">Deja en 0 si el precio es parte de un paquete</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelid">Hotel (opcional)</Label>
              <Select
                value={formData.hotelid}
                onValueChange={(value) => setFormData({ ...formData, hotelid: value === "todos" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los hoteles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los hoteles</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min={0}
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/30">
            <Switch
              id="disponible"
              checked={formData.disponible}
              onCheckedChange={(checked) => setFormData({ ...formData, disponible: checked })}
            />
            <div>
              <Label htmlFor="disponible" className="cursor-pointer font-medium">
                Disponible
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.disponible
                  ? "Este platillo esta disponible para seleccion en cotizaciones"
                  : "Este platillo no aparecera en las opciones de menu"}
              </p>
            </div>
          </div>
        </div>

        {/* Alergenos */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Alergenos
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona los alergenos presentes en este platillo
          </p>

          {/* Alergenos seleccionados */}
          {formData.alergenos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.alergenos.map((a) => (
                <Badge key={a} variant="default" className="gap-1 pr-1">
                  {a}
                  <button
                    type="button"
                    onClick={() => removeAlergeno(a)}
                    className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Lista de alergenos comunes */}
          <div className="flex flex-wrap gap-2">
            {ALERGENOS_COMUNES.map((alergeno) => {
              const isSelected = formData.alergenos.includes(alergeno)
              return (
                <button
                  key={alergeno}
                  type="button"
                  onClick={() => toggleAlergeno(alergeno)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors
                    ${isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {alergeno}
                </button>
              )
            })}
          </div>
        </div>

        {/* Imagen */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Imagen (opcional)
          </h3>
          <div className="space-y-2">
            <Label htmlFor="imagenurl">URL de imagen</Label>
            <Input
              id="imagenurl"
              value={formData.imagenurl}
              onChange={(e) => setFormData({ ...formData, imagenurl: e.target.value })}
              placeholder="https://..."
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Pega la URL de una imagen del platillo
            </p>
          </div>
          {formData.imagenurl && (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.imagenurl}
                alt={formData.nombre || "Preview"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            type="submit"
            disabled={saving}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? "Guardando..." : isEditing ? "Actualizar Platillo" : "Crear Platillo"}
          </Button>
          <Link href="/menus">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </div>
    </form>
  )
}
