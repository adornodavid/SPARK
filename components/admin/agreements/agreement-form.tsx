"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import { crearConvenio, actualizarConvenio, obtenerConvenio } from "@/app/actions/convenios"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import type { oConvenioForm } from "@/types/convenios"
import { TIPOS_DESCUENTO, APLICA_A_OPTIONS } from "@/types/convenios"
import type { ddlItem } from "@/types/common"

interface AgreementFormProps {
  agreementId?: string
}

const emptyForm: oConvenioForm = {
  empresa: "",
  contacto: "",
  email: "",
  telefono: "",
  hotelid: null,
  tipo_descuento: "porcentaje",
  descuento_valor: 0,
  aplica_a: "ambos",
  condiciones: "",
  vigencia_inicio: "",
  vigencia_fin: "",
  estado: "activo",
  notas: "",
}

export function AgreementForm({ agreementId }: AgreementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!agreementId)
  const [hoteles, setHoteles] = useState<ddlItem[]>([])
  const [formData, setFormData] = useState<oConvenioForm>(emptyForm)

  const isEditing = !!agreementId

  useEffect(() => {
    async function loadInitialData() {
      const hotelResult = await listaDesplegableHoteles()
      if (hotelResult.success && hotelResult.data) {
        setHoteles(hotelResult.data as ddlItem[])
      }

      if (agreementId) {
        const result = await obtenerConvenio(Number(agreementId))
        if (result.success && result.data) {
          const c = result.data
          setFormData({
            empresa: c.empresa || "",
            contacto: c.contacto || "",
            email: c.email || "",
            telefono: c.telefono || "",
            hotelid: c.hotelid,
            tipo_descuento: c.tipo_descuento,
            descuento_valor: c.descuento_valor,
            aplica_a: c.aplica_a,
            condiciones: c.condiciones || "",
            vigencia_inicio: c.vigencia_inicio || "",
            vigencia_fin: c.vigencia_fin || "",
            estado: c.estado,
            notas: c.notas || "",
          })
        } else {
          toast.error("No se pudo cargar el convenio")
          router.push("/agreements")
        }
        setLoadingData(false)
      }
    }
    loadInitialData()
  }, [agreementId, router])

  function updateField<K extends keyof oConvenioForm>(key: K, value: oConvenioForm[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing) {
        const result = await actualizarConvenio(Number(agreementId), formData)
        if (result.success) {
          toast.success("Convenio actualizado correctamente")
          router.push(`/agreements/${agreementId}`)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await crearConvenio(formData)
        if (result.success && result.data) {
          toast.success("Convenio creado correctamente")
          router.push(`/agreements/${result.data.id}`)
        } else {
          toast.error(result.error)
        }
      }
    } catch {
      toast.error("Error inesperado al guardar")
    }

    setLoading(false)
  }

  if (loadingData) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8">
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          Cargando convenio...
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informacion de la empresa */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle>Informacion de la Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa">Nombre de la Empresa *</Label>
            <Input
              id="empresa"
              value={formData.empresa}
              onChange={(e) => updateField("empresa", e.target.value)}
              placeholder="Ej: Grupo Industrial MTY SA de CV"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto">Persona de Contacto</Label>
              <Input
                id="contacto"
                value={formData.contacto}
                onChange={(e) => updateField("contacto", e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="correo@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => updateField("telefono", e.target.value)}
                placeholder="+52 81 1234 5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles del convenio */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle>Detalles del Convenio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelid">Hotel</Label>
              <Select
                value={formData.hotelid ? formData.hotelid.toString() : "ninguno"}
                onValueChange={(value) =>
                  updateField("hotelid", value === "ninguno" ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Todos los hoteles</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplica_a">Aplica a *</Label>
              <Select
                value={formData.aplica_a}
                onValueChange={(value) => updateField("aplica_a", value as "habitaciones" | "salones" | "ambos")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APLICA_A_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_descuento">Tipo de Descuento *</Label>
              <Select
                value={formData.tipo_descuento}
                onValueChange={(value) => updateField("tipo_descuento", value as "porcentaje" | "monto_fijo")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DESCUENTO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descuento_valor">
                Valor del Descuento *
                {formData.tipo_descuento === "porcentaje" ? " (%)" : " ($ MXN)"}
              </Label>
              <Input
                id="descuento_valor"
                type="number"
                step="0.01"
                min="0"
                max={formData.tipo_descuento === "porcentaje" ? "100" : undefined}
                value={formData.descuento_valor || ""}
                onChange={(e) => updateField("descuento_valor", Number(e.target.value))}
                placeholder={formData.tipo_descuento === "porcentaje" ? "15" : "500"}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigencia_inicio">Vigencia Inicio *</Label>
              <Input
                id="vigencia_inicio"
                type="date"
                value={formData.vigencia_inicio}
                onChange={(e) => updateField("vigencia_inicio", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vigencia_fin">Vigencia Fin *</Label>
              <Input
                id="vigencia_fin"
                type="date"
                value={formData.vigencia_fin}
                onChange={(e) => updateField("vigencia_fin", e.target.value)}
                required
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => updateField("estado", value as "activo" | "vencido" | "cancelado")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condiciones y notas */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle>Condiciones y Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condiciones">Condiciones del Convenio</Label>
            <Textarea
              id="condiciones"
              value={formData.condiciones}
              onChange={(e) => updateField("condiciones", e.target.value)}
              placeholder="Detalla las condiciones especiales, restricciones, periodos de bloqueo, etc..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Internas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => updateField("notas", e.target.value)}
              placeholder="Notas privadas para el equipo de ventas..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de accion */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Actualizar Convenio" : "Crear Convenio"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
