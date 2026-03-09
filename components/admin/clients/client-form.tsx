"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
}

interface Client {
  id?: string
  type: string
  first_name?: string
  last_name?: string
  company_name?: string
  rfc?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  source?: string
  tags?: Record<string, unknown>
  notes?: string
  preferred_contact_method?: string
  birthday?: string
  assigned_to?: string
  created_by?: string
}

interface ClientFormProps {
  client?: Client
  users: User[]
  currentUserId: string
}

export function ClientForm({ client, users, currentUserId }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Client>({
    type: client?.type || "individual",
    company_name: client?.company_name || "",
    rfc: client?.rfc || "",
    first_name: client?.first_name || "",
    last_name: client?.last_name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    mobile: client?.mobile || "",
    address: client?.address || "",
    city: client?.city || "",
    state: client?.state || "",
    country: client?.country || "México",
    postal_code: client?.postal_code || "",
    preferred_contact_method: client?.preferred_contact_method || "email",
    assigned_to: client?.assigned_to || currentUserId,
    source: client?.source || "",
    tags: client?.tags || {},
    notes: client?.notes || "",
    birthday: client?.birthday || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const dataToSave = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        created_by: client?.id ? undefined : currentUserId,
        birthday: formData.birthday || null,
        source: formData.source || null,
        notes: formData.notes || null,
      }

      if (client?.id) {
        const { error: updateError } = await supabase.from("clients").update(dataToSave).eq("id", client.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("clients").insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push("/clientes")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Datos principales del cliente. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cliente *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Asignado a</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "empresa" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                  <Input
                    id="company_name"
                    required={formData.type === "empresa"}
                    placeholder="Empresa S.A. de C.V."
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    placeholder="ABC123456XYZ"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre {formData.type === "individual" && "*"}</Label>
                <Input
                  id="first_name"
                  required={formData.type === "individual"}
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido {formData.type === "individual" && "*"}</Label>
                <Input
                  id="last_name"
                  required={formData.type === "individual"}
                  placeholder="Pérez"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            {formData.type === "individual" && (
              <div className="space-y-2">
                <Label htmlFor="birthday">Fecha de Nacimiento</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_contact_method">Contacto Preferido</Label>
                <Select
                  value={formData.preferred_contact_method}
                  onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="mobile">Celular</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+52 123 456 7890"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Calle y Número</Label>
              <Input
                id="address"
                placeholder="Calle Principal #123"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  placeholder="México"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">C.P.</Label>
                <Input
                  id="postal_code"
                  placeholder="12345"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente / Origen del Contacto</Label>
              <Input
                id="source"
                placeholder="Referido, Web, Redes Sociales, Evento, etc."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas internas sobre el cliente, preferencias, comentarios especiales..."
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : client?.id ? "Actualizar Cliente" : "Crear Cliente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/clientes")}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  )
}
