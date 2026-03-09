"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { crearPaquete } from "@/app/actions/paquetes"
import { TIPOS_PAQUETE } from "@/types/paquetes"
import type { ddlItem } from "@/types/common"

interface PaqueteFormNuevoProps {
  hoteles: ddlItem[]
}

export function PaqueteFormNuevo({ hoteles }: PaqueteFormNuevoProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [hotelid, setHotelid] = useState("")
  const [tipo, setTipo] = useState("")
  const [preciobase, setPreciobase] = useState("")
  const [precioporpersona, setPrecioporpersona] = useState("")
  const [minimopersonas, setMinimopersonas] = useState("1")
  const [maximopersonas, setMaximopersonas] = useState("")
  const [incluye, setIncluye] = useState<string[]>([])
  const [nuevoItem, setNuevoItem] = useState("")
  const [vigenciainicio, setVigenciainicio] = useState("")
  const [vigenciafin, setVigenciafin] = useState("")
  const [activo, setActivo] = useState(true)

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
    // Validaciones del lado del cliente
    if (!nombre.trim()) {
      toast.error("El nombre del paquete es requerido")
      return
    }
    if (!hotelid) {
      toast.error("Selecciona un hotel")
      return
    }
    if (!tipo) {
      toast.error("Selecciona un tipo de paquete")
      return
    }

    setSaving(true)

    const result = await crearPaquete({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
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

    if (result.success && result.data) {
      toast.success("Paquete creado correctamente")
      router.push(`/packages/${result.data.id}`)
    } else {
      toast.error(result.error || "Error al crear el paquete")
    }
  }

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
            <h1 className="text-2xl font-semibold tracking-tight">Nuevo Paquete</h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo paquete de banquetes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/packages">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Creando..." : "Crear Paquete"}
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
