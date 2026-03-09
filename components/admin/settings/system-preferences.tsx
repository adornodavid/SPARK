"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Palette,
  Bell,
  Building2,
  Monitor,
  Moon,
  Sun,
  Save,
  RotateCcw,
} from "lucide-react"
import { useTheme } from "next-themes"
import { actualizarConfiguracion } from "@/app/actions/configuraciones"

interface SystemPreferencesProps {
  config: Record<string, string>
  hoteles: any[]
  onRefresh: () => void
}

export function SystemPreferences({ config, hoteles, onRefresh }: SystemPreferencesProps) {
  const { theme, setTheme } = useTheme()
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
        toast.success("Preferencias guardadas exitosamente")
        setHasChanges(false)
        onRefresh()
      } else {
        toast.error(result.error || "Error al guardar preferencias")
      }
    } catch {
      toast.error("Error al guardar preferencias")
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
            <Palette className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Preferencias del Sistema</h3>
            <p className="text-sm text-muted-foreground">
              Personaliza la apariencia y comportamiento del portal
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
        {/* Theme */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Apariencia
            </CardTitle>
            <CardDescription>
              Tema visual del portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className={`flex flex-col gap-2 h-auto py-4 ${
                    theme === "light"
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : ""
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs">Claro</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className={`flex flex-col gap-2 h-auto py-4 ${
                    theme === "dark"
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : ""
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs">Oscuro</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className={`flex flex-col gap-2 h-auto py-4 ${
                    theme === "system"
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : ""
                  }`}
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-xs">Sistema</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El tema se aplica inmediatamente y se guarda en tu navegador
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-xl border border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Preferencias de alertas y avisos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Notificaciones por email</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recibir alertas de cotizaciones y reservaciones por correo
                </p>
              </div>
              <Switch
                checked={formData.notificaciones_email === "true"}
                onCheckedChange={(checked) =>
                  handleChange("notificaciones_email", checked ? "true" : "false")
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Notificaciones del sistema</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mostrar alertas dentro del portal (cotizaciones por vencer, pagos pendientes)
                </p>
              </div>
              <Switch
                checked={formData.notificaciones_sistema === "true"}
                onCheckedChange={(checked) =>
                  handleChange("notificaciones_sistema", checked ? "true" : "false")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Hotel */}
        <Card className="rounded-xl border border-border/50 bg-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Valores Predeterminados
            </CardTitle>
            <CardDescription>
              Configuracion por defecto para nuevos registros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-sm">
              <Label>Hotel predeterminado para nuevos usuarios</Label>
              <Select
                value={formData.hotel_default_nuevos_usuarios || ""}
                onValueChange={(val) => handleChange("hotel_default_nuevos_usuarios", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin hotel predeterminado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin hotel predeterminado</SelectItem>
                  {hoteles.map((hotel: any) => {
                    const hid = hotel.hotelid || hotel.id
                    return (
                      <SelectItem key={hid} value={String(hid)}>
                        {hotel.nombre}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Este hotel se asignara automaticamente al crear nuevos usuarios
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
