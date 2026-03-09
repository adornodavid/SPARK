"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  obtenerCategoriaMenu,
  crearCategoriaMenu,
  actualizarCategoriaMenu,
} from "@/app/actions/menus"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import type { ddlItem } from "@/types/common"

interface MenuCategoryFormProps {
  categoryId?: string
}

export function MenuCategoryForm({ categoryId }: MenuCategoryFormProps) {
  const router = useRouter()
  const isEditing = !!categoryId
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditing)
  const [hoteles, setHoteles] = useState<ddlItem[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    orden: 0,
    hotelid: "" as string,
  })

  useEffect(() => {
    loadHoteles()
    if (categoryId) {
      loadCategory(Number(categoryId))
    }
  }, [categoryId])

  async function loadHoteles() {
    const result = await listaDesplegableHoteles()
    if (result.success && result.data) {
      setHoteles(result.data)
    }
  }

  async function loadCategory(id: number) {
    setLoadingData(true)
    const result = await obtenerCategoriaMenu(id)
    if (result.success && result.data) {
      setFormData({
        nombre: result.data.nombre || "",
        descripcion: result.data.descripcion || "",
        orden: result.data.orden || 0,
        hotelid: result.data.hotelid ? result.data.hotelid.toString() : "",
      })
    } else {
      toast.error(result.error || "Error cargando categoria")
      router.push("/menus")
    }
    setLoadingData(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        const result = await actualizarCategoriaMenu(Number(categoryId), {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          orden: formData.orden,
          hotelid: formData.hotelid ? Number(formData.hotelid) : null,
        })

        if (result.success) {
          toast.success("Categoria actualizada correctamente")
          router.push("/menus")
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await crearCategoriaMenu({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          orden: formData.orden || undefined,
          hotelid: formData.hotelid ? Number(formData.hotelid) : null,
        })

        if (result.success) {
          toast.success("Categoria creada correctamente")
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="spark-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <Link href="/menus">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold text-foreground">
              {isEditing ? "Editar Categoria" : "Nueva Categoria"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Modifica la informacion de la categoria" : "Crea una nueva categoria para organizar platillos"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Entradas, Platos Fuertes, Postres..."
              required
              minLength={2}
            />
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
            <p className="text-xs text-muted-foreground">
              Deja vacio para que la categoria aplique a todos los hoteles
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripcion</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Describe el tipo de platillos en esta categoria..."
            rows={3}
          />
        </div>

        <div className="space-y-2 max-w-[200px]">
          <Label htmlFor="orden">Orden de aparicion</Label>
          <Input
            id="orden"
            type="number"
            min={0}
            value={formData.orden}
            onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            type="submit"
            disabled={saving}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? "Guardando..." : isEditing ? "Actualizar Categoria" : "Crear Categoria"}
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
