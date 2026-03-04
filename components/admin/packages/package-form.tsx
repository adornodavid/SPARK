"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

interface PackageFormProps {
  packageId?: string
}

export function PackageForm({ packageId }: PackageFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [hotels, setHotels] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hotel_id: "",
    price_per_person: "",
    min_people: "",
    max_people: "",
    includes: "",
    is_active: true,
  })

  useEffect(() => {
    loadHotels()
    if (packageId) {
      loadPackage()
    }
  }, [packageId])

  async function loadHotels() {
    const { data } = await supabase.from("hotels").select("id, name").eq("status", "active").order("name")

    if (data) setHotels(data)
  }

  async function loadPackage() {
    const { data, error } = await supabase.from("banquet_packages").select("*").eq("id", packageId).single()

    if (error) {
      console.error("Error loading package:", error)
      return
    }

    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        hotel_id: data.hotel_id || "",
        price_per_person: data.price_per_person?.toString() || "",
        min_people: data.min_people?.toString() || "",
        max_people: data.max_people?.toString() || "",
        includes: data.includes || "",
        is_active: data.is_active ?? true,
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const packageData = {
      name: formData.name,
      description: formData.description,
      hotel_id: formData.hotel_id,
      price_per_person: Number.parseFloat(formData.price_per_person),
      min_people: Number.parseInt(formData.min_people),
      max_people: formData.max_people ? Number.parseInt(formData.max_people) : null,
      includes: formData.includes,
      is_active: formData.is_active,
    }

    const { error } = packageId
      ? await supabase.from("banquet_packages").update(packageData).eq("id", packageId)
      : await supabase.from("banquet_packages").insert(packageData)

    setLoading(false)

    if (error) {
      console.error("Error saving package:", error)
      alert("Error al guardar el paquete")
      return
    }

    router.push("/admin/packages")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Paquete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Paquete *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
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

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_per_person">Precio por Persona *</Label>
              <Input
                id="price_per_person"
                type="number"
                step="0.01"
                value={formData.price_per_person}
                onChange={(e) => setFormData({ ...formData, price_per_person: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_people">Mínimo de Personas *</Label>
              <Input
                id="min_people"
                type="number"
                value={formData.min_people}
                onChange={(e) => setFormData({ ...formData, min_people: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_people">Máximo de Personas</Label>
              <Input
                id="max_people"
                type="number"
                value={formData.max_people}
                onChange={(e) => setFormData({ ...formData, max_people: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="includes">Qué Incluye</Label>
            <Textarea
              id="includes"
              value={formData.includes}
              onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
              placeholder="Ej: Montaje, mantelería, servicio de meseros..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Paquete Activo</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : packageId ? "Actualizar" : "Crear"} Paquete
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
