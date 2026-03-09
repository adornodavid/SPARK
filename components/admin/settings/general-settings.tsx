"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Settings,
  DollarSign,
  Clock,
  Mail,
  Calendar,
  Save,
  RotateCcw,
} from "lucide-react"
import { actualizarConfiguracion } from "@/app/actions/configuraciones"

interface GeneralSettingsProps {
  config: Record<string, string>
  onRefresh: () => void
}

export function GeneralSettings({ config, onRefresh }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<Record<string, string>>({ ...config })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  function handleChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  function handleReset() {
    setFormData({ ...config })
    setHasChanges(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await actualizarConfiguracion(formData)
      if (result.success) {
        toast.success("Configuracion guardada exitosamente")
        setHasChanges(false)
        onRefresh()
      } else {
        toast.error(result.error || "Error al guardar configuracion")
      }
    } catch {
      toast.error("Error al guardar configuracion")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Configuracion General</h3>
            <p className="text-sm text-muted-foreground">
              Ajustes globales del sistema de cotizaciones y eventos
            </p>
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Facturacion */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Facturacion y Precios
            </CardTitle>
            <CardDescription>
              Configuracion de impuestos, moneda y precios base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="iva">Porcentaje de IVA</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="iva"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.iva_porcentaje || "16"}
                  onChange={(e) => handleChange("iva_porcentaje", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se aplica automaticamente al subtotal de las cotizaciones
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda || "MXN"}
                onValueChange={(val) => handleChange("moneda", val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  <SelectItem value="USD">USD - Dolar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cotizaciones */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cotizaciones
            </CardTitle>
            <CardDescription>
              Configuracion de validez y parametros de cotizaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="dias-validez">Dias de validez de cotizacion</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dias-validez"
                  type="number"
                  min="1"
                  max="90"
                  value={formData.dias_validez_cotizacion || "15"}
                  onChange={(e) => handleChange("dias_validez_cotizacion", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Las cotizaciones vencen automaticamente despues de este periodo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configuracion de correos y alertas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email-notif">Email de notificaciones</Label>
              <Input
                id="email-notif"
                type="email"
                value={formData.email_notificaciones || ""}
                onChange={(e) => handleChange("email_notificaciones", e.target.value)}
                placeholder="notificaciones@hotel.com"
              />
              <p className="text-xs text-muted-foreground">
                Recibe alertas de nuevas cotizaciones, pagos y reservaciones
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Horario */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horarios
            </CardTitle>
            <CardDescription>
              Horario de atencion y operacion del portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="horario">Horario de atencion</Label>
              <Input
                id="horario"
                value={formData.horario_atencion || "09:00 - 18:00"}
                onChange={(e) => handleChange("horario_atencion", e.target.value)}
                placeholder="09:00 - 18:00"
              />
              <p className="text-xs text-muted-foreground">
                Se muestra en cotizaciones y correos al cliente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
