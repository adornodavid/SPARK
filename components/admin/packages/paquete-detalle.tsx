"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  DollarSign,
  Users,
  Calendar,
  Hotel,
  Package,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { actualizarPaquete, eliminarPaquete } from "@/app/actions/paquetes"
import type { oPaquete } from "@/types/paquetes"
import { TIPOS_PAQUETE, TIPO_PAQUETE_CONFIG } from "@/types/paquetes"
import type { ddlItem } from "@/types/common"

interface PaqueteDetalleProps {
  paquete: oPaquete
  hoteles: ddlItem[]
}

const formatMXN = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function PaqueteDetalle({ paquete, hoteles }: PaqueteDetalleProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [nombre, setNombre] = useState(paquete.nombre)
  const [descripcion, setDescripcion] = useState(paquete.descripcion || "")
  const [hotelid, setHotelid] = useState(paquete.hotelid.toString())
  const [tipo, setTipo] = useState(paquete.tipo)
  const [preciobase, setPreciobase] = useState(paquete.preciobase.toString())
  const [precioporpersona, setPrecioporpersona] = useState(paquete.precioporpersona.toString())
  const [minimopersonas, setMinimopersonas] = useState(paquete.minimopersonas.toString())
  const [maximopersonas, setMaximopersonas] = useState(paquete.maximopersonas?.toString() || "")
  const [incluye, setIncluye] = useState<string[]>(paquete.incluye || [])
  const [nuevoItem, setNuevoItem] = useState("")
  const [vigenciainicio, setVigenciainicio] = useState(paquete.vigenciainicio || "")
  const [vigenciafin, setVigenciafin] = useState(paquete.vigenciafin || "")
  const [activo, setActivo] = useState(paquete.activo)

  const tipoConfig = TIPO_PAQUETE_CONFIG[paquete.tipo] || TIPO_PAQUETE_CONFIG["Otro"]

  const handleAddItem = () => {
    const item = nuevoItem.trim()
    if (item === "") return
    if (incluye.includes(item)) {
      toast.warning("Este item ya esta en la lista")
      return
    }
    setIncluye([...incluye, item])
    setNuevoItem("")
  }

  const handleRemoveItem = (index: number) => {
    setIncluye(incluye.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddItem()
    }
  }

  const handleSave = async () => {
    setSaving(true)

    const result = await actualizarPaquete(paquete.id, {
      nombre,
      descripcion: descripcion || undefined,
      hotelid: Number(hotelid),
      tipo,
      preciobase: Number(preciobase) || 0,
      precioporpersona: Number(precioporpersona) || 0,
      minimopersonas: Number(minimopersonas) || 1,
      maximopersonas: maximopersonas ? Number(maximopersonas) : undefined,
      incluye,
      vigenciainicio: vigenciainicio || undefined,
      vigenciafin: vigenciafin || undefined,
      activo,
    })

    setSaving(false)

    if (result.success) {
      toast.success("Paquete actualizado correctamente")
      setIsEditing(false)
      router.refresh()
    } else {
      toast.error(result.error || "Error al actualizar el paquete")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await eliminarPaquete(paquete.id)
    setDeleting(false)

    if (result.success) {
      toast.success("Paquete eliminado correctamente")
      router.push("/packages")
    } else {
      toast.error(result.error || "Error al eliminar el paquete")
    }
  }

  // View mode
  if (!isEditing) {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/packages">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{paquete.nombre}</h1>
              <p className="text-sm text-muted-foreground">{paquete.hotel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar paquete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion desactivara el paquete &quot;{paquete.nombre}&quot;. No se eliminara de la base de datos pero dejara de estar disponible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              {paquete.activo ? (
                <CheckCircle2 className="h-4 w-4 text-lime-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">Estado</span>
            </div>
            <Badge variant="outline" className={paquete.activo ? "bg-lime-100 text-lime-700 border-lime-300" : "bg-red-100 text-red-700 border-red-300"}>
              {paquete.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {/* Tipo */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tipo</span>
            </div>
            <Badge variant="outline" className={`border ${tipoConfig.bgColor} ${tipoConfig.color}`}>
              {tipoConfig.label}
            </Badge>
          </div>

          {/* Capacidad */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Capacidad</span>
            </div>
            <p className="text-lg font-semibold">
              {paquete.minimopersonas}{paquete.maximopersonas ? ` - ${paquete.maximopersonas}` : "+"} personas
            </p>
          </div>
        </div>

        {/* Precios */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Precios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paquete.preciobase > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Precio base</p>
                <p className="text-2xl font-bold">{formatMXN(paquete.preciobase)}</p>
              </div>
            )}
            {paquete.precioporpersona > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Precio por persona</p>
                <p className="text-2xl font-bold">{formatMXN(paquete.precioporpersona)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Descripcion */}
        {paquete.descripcion && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h2 className="text-lg font-semibold mb-3">Descripcion</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{paquete.descripcion}</p>
          </div>
        )}

        {/* Incluye */}
        {paquete.incluye && paquete.incluye.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h2 className="text-lg font-semibold mb-3">Que incluye</h2>
            <ul className="space-y-2">
              {paquete.incluye.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-lime-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vigencia */}
        {(paquete.vigenciainicio || paquete.vigenciafin) && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Vigencia</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Desde</p>
                <p className="text-sm font-medium">
                  {paquete.vigenciainicio
                    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(paquete.vigenciainicio))
                    : "Sin limite"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hasta</p>
                <p className="text-sm font-medium">
                  {paquete.vigenciafin
                    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(paquete.vigenciafin))
                    : "Sin limite"}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Edit mode
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editar Paquete</h1>
            <p className="text-sm text-muted-foreground">Modifica la informacion del paquete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Informacion general */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Informacion General</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Paquete *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Paquete Boda Romance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select value={hotelid} onValueChange={setHotelid}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Paquete *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PAQUETE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4 pb-1">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={activo}
                    onCheckedChange={setActivo}
                  />
                  <Label htmlFor="activo">Paquete Activo</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el paquete..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Precios y Capacidad */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Precios y Capacidad</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preciobase">Precio Base (MXN)</Label>
              <Input
                id="preciobase"
                type="number"
                step="0.01"
                min="0"
                value={preciobase}
                onChange={(e) => setPreciobase(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioporpersona">Precio por Persona (MXN)</Label>
              <Input
                id="precioporpersona"
                type="number"
                step="0.01"
                min="0"
                value={precioporpersona}
                onChange={(e) => setPrecioporpersona(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimopersonas">Minimo Personas *</Label>
              <Input
                id="minimopersonas"
                type="number"
                min="1"
                value={minimopersonas}
                onChange={(e) => setMinimopersonas(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maximopersonas">Maximo Personas</Label>
              <Input
                id="maximopersonas"
                type="number"
                min="0"
                value={maximopersonas}
                onChange={(e) => setMaximopersonas(e.target.value)}
                placeholder="Sin limite"
              />
            </div>
          </div>
        </div>

        {/* Que incluye */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Que Incluye</h2>
          <div className="space-y-3">
            {/* Input para agregar items */}
            <div className="flex gap-2">
              <Input
                value={nuevoItem}
                onChange={(e) => setNuevoItem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Menu de 3 tiempos, Barra libre, Decoracion..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                disabled={nuevoItem.trim() === ""}
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar
              </Button>
            </div>

            {/* Lista de items */}
            {incluye.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay items incluidos. Agrega los servicios que incluye este paquete.
              </p>
            ) : (
              <ul className="space-y-2">
                {incluye.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-lime-600 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Vigencia */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Vigencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigenciainicio">Fecha de Inicio</Label>
              <Input
                id="vigenciainicio"
                type="date"
                value={vigenciainicio}
                onChange={(e) => setVigenciainicio(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Dejar vacio para sin limite de inicio</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vigenciafin">Fecha de Fin</Label>
              <Input
                id="vigenciafin"
                type="date"
                value={vigenciafin}
                onChange={(e) => setVigenciafin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Dejar vacio para sin limite de fin</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
