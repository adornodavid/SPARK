"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { crearActividad } from "@/app/actions/crm"
import { TIPOS_ACTIVIDAD, type TipoActividadId } from "@/types/crm"
import { toast } from "sonner"
import {
  Phone,
  Mail,
  Users,
  MapPin,
  FileText,
  Clock,
  CheckSquare,
} from "lucide-react"

const iconMap: Record<string, any> = {
  Phone, Mail, Users, MapPin, FileText, Clock, CheckSquare,
}

interface NewActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId?: number
  oportunidadId?: number
  vendedorId: number
  onCreated?: () => void
}

export function NewActivityDialog({
  open,
  onOpenChange,
  clienteId,
  oportunidadId,
  vendedorId,
  onCreated,
}: NewActivityDialogProps) {
  const [saving, setSaving] = useState(false)
  const [tipo, setTipo] = useState<TipoActividadId>("llamada")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [hora, setHora] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [notas, setNotas] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion.trim()) {
      toast.error("La descripcion es requerida")
      return
    }

    setSaving(true)
    const result = await crearActividad({
      tipo,
      fecha,
      hora: hora || undefined,
      descripcion,
      clienteId,
      oportunidadId,
      vendedorId,
      notas: notas || undefined,
    })

    if (result.success) {
      toast.success("Actividad programada")
      // Reset form
      setDescripcion("")
      setNotas("")
      setHora("")
      setTipo("llamada")
      onCreated?.()
    } else {
      toast.error(result.error || "Error al crear actividad")
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Tipo de Actividad</Label>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS_ACTIVIDAD.map((tipoAct) => {
                const IconComp = iconMap[tipoAct.icon] || Clock
                const isSelected = tipo === tipoAct.id
                return (
                  <button
                    key={tipoAct.id}
                    type="button"
                    onClick={() => setTipo(tipoAct.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    <span className="truncate w-full text-center">{tipoAct.nombre}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora (opcional)</Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Llamar para dar seguimiento a cotizacion..."
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? "Guardando..." : "Programar Actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
