"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Hotel {
  id?: string
  code: string
  name: string
  address: string
  city: string
  state: string
  country: string
  postal_code?: string
  phone?: string
  email?: string
  status: string
  check_in_time: string
  check_out_time: string
  tax_rate: number
  ish_rate?: number
  currency: string
}

interface HotelFormProps {
  hotel?: Hotel
}

export function HotelForm({ hotel }: HotelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Hotel>({
    code: hotel?.code || "",
    name: hotel?.name || "",
    address: hotel?.address || "",
    city: hotel?.city || "",
    state: hotel?.state || "",
    country: hotel?.country || "México",
    postal_code: hotel?.postal_code || "",
    phone: hotel?.phone || "",
    email: hotel?.email || "",
    status: hotel?.status || "activo",
    check_in_time: hotel?.check_in_time || "15:00",
    check_out_time: hotel?.check_out_time || "12:00",
    tax_rate: hotel?.tax_rate || 16.0,
    ish_rate: hotel?.ish_rate || 3.0,
    currency: hotel?.currency || "MXN",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (hotel?.id) {
        // Update existing hotel
        const { error: updateError } = await supabase.from("hotels").update(formData).eq("id", hotel.id)

        if (updateError) throw updateError
      } else {
        // Create new hotel
        const { error: insertError } = await supabase.from("hotels").insert(formData)

        if (insertError) throw insertError
      }

      router.push("/hoteles")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el hotel")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Hotel</CardTitle>
          <CardDescription>Complete los datos del hotel. Los campos marcados con * son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código * (3 letras)</Label>
              <Input
                id="code"
                required
                maxLength={3}
                placeholder="TEC"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!hotel?.id}
              />
              <p className="text-xs text-muted-foreground">Ejemplo: TEC, MRL, PZY (se usará para generar folios)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Hotel *</Label>
            <Input
              id="name"
              required
              placeholder="Hotel Tecate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              required
              placeholder="Calle Principal #123"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                required
                placeholder="Tecate"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                required
                placeholder="Baja California"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                required
                placeholder="México"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                placeholder="21400"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+52 123 456 7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hotel@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in_time">Hora de Check-in *</Label>
              <Input
                id="check_in_time"
                type="time"
                required
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_time">Hora de Check-out *</Label>
              <Input
                id="check_out_time"
                type="time"
                required
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tax_rate">IVA (%) *</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ish_rate">ISH (%) - Hospedaje</Label>
              <Input
                id="ish_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.ish_rate}
                onChange={(e) => setFormData({ ...formData, ish_rate: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : hotel?.id ? "Actualizar Hotel" : "Crear Hotel"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/hoteles")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
