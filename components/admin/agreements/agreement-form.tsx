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
import { createBrowserClient } from "@/lib/supabase/client"

interface AgreementFormProps {
  agreementId?: string
}

export function AgreementForm({ agreementId }: AgreementFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    hotel_id: "",
    start_date: "",
    end_date: "",
    discount_percentage: "",
    description: "",
    terms_conditions: "",
    notes: "",
  })

  useEffect(() => {
    loadInitialData()
    if (agreementId) {
      loadAgreement()
    }
  }, [agreementId])

  async function loadInitialData() {
    const [{ data: user }, clientsRes, hotelsRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("clients").select("id, name, type").eq("status", "active").order("name"),
      supabase.from("hotels").select("id, name").eq("status", "active").order("name"),
    ])

    if (user?.user) setCurrentUserId(user.user.id)
    if (clientsRes.data) setClients(clientsRes.data)
    if (hotelsRes.data) setHotels(hotelsRes.data)
  }

  async function loadAgreement() {
    const { data, error } = await supabase.from("corporate_agreements").select("*").eq("id", agreementId).single()

    if (error) {
      console.error("Error loading agreement:", error)
      return
    }

    if (data) {
      setFormData({
        name: data.name || "",
        client_id: data.client_id || "",
        hotel_id: data.hotel_id || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        discount_percentage: data.discount_percentage?.toString() || "",
        description: data.description || "",
        terms_conditions: data.terms_conditions || "",
        notes: data.notes || "",
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const agreementData = {
      name: formData.name,
      client_id: formData.client_id,
      hotel_id: formData.hotel_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      discount_percentage: Number.parseFloat(formData.discount_percentage),
      description: formData.description || null,
      terms_conditions: formData.terms_conditions || null,
      notes: formData.notes || null,
      status: "active",
      salesperson_id: currentUserId,
    }

    const { error } = agreementId
      ? await supabase.from("corporate_agreements").update(agreementData).eq("id", agreementId)
      : await supabase.from("corporate_agreements").insert(agreementData)

    setLoading(false)

    if (error) {
      console.error("Error saving agreement:", error)
      alert("Error al guardar el convenio")
      return
    }

    router.push("/admin/agreements")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Convenio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Convenio *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Convenio Corporativo Empresa XYZ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.type === "individual" ? "Individual" : "Empresa"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel_id">Hotel *</Label>
              <Select
                value={formData.hotel_id}
                onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de Fin *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Descuento % *</Label>
              <Input
                id="discount_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los beneficios del convenio..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Términos y Condiciones</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              placeholder="Términos y condiciones del convenio..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas privadas para el equipo..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : agreementId ? "Actualizar" : "Crear"} Convenio
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
