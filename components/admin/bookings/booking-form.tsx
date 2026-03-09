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
import { toast } from "sonner"

interface BookingFormProps {
  bookingId?: string
}

export function BookingForm({ bookingId }: BookingFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [formData, setFormData] = useState({
    client_id: "",
    hotel_id: "",
    room_id: "",
    agreement_id: "",
    check_in_date: "",
    check_out_date: "",
    number_of_guests: "1",
    number_of_adults: "1",
    number_of_children: "0",
    special_requests: "",
    notes: "",
  })

  useEffect(() => {
    loadInitialData()
    if (bookingId) {
      loadBooking()
    }
  }, [bookingId])

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

  async function loadRooms(hotelId: string) {
    const { data } = await supabase
      .from("rooms")
      .select("id, room_number, category:room_categories(name)")
      .eq("hotel_id", hotelId)
      .eq("status", "available")
      .order("room_number")

    if (data) setRooms(data)
  }

  async function loadAgreements(hotelId: string, clientId: string) {
    const { data } = await supabase
      .from("corporate_agreements")
      .select("id, name, discount_percentage")
      .eq("hotel_id", hotelId)
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("name")

    if (data) setAgreements(data)
  }

  async function loadBooking() {
    const { data, error } = await supabase.from("room_bookings").select("*").eq("id", bookingId).single()

    if (error) {
      return
    }

    if (data) {
      setFormData({
        client_id: data.client_id || "",
        hotel_id: data.hotel_id || "",
        room_id: data.room_id || "",
        agreement_id: data.agreement_id || "",
        check_in_date: data.check_in_date || "",
        check_out_date: data.check_out_date || "",
        number_of_guests: data.number_of_guests?.toString() || "1",
        number_of_adults: data.number_of_adults?.toString() || "1",
        number_of_children: data.number_of_children?.toString() || "0",
        special_requests: data.special_requests || "",
        notes: data.notes || "",
      })

      if (data.hotel_id) {
        loadRooms(data.hotel_id)
        if (data.client_id) {
          loadAgreements(data.hotel_id, data.client_id)
        }
      }
    }
  }

  function calculateNights() {
    if (!formData.check_in_date || !formData.check_out_date) return 0
    const checkIn = new Date(formData.check_in_date)
    const checkOut = new Date(formData.check_out_date)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const nights = calculateNights()

    const bookingData = {
      client_id: formData.client_id,
      hotel_id: formData.hotel_id,
      room_id: formData.room_id,
      agreement_id: formData.agreement_id || null,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      number_of_nights: nights,
      number_of_guests: Number.parseInt(formData.number_of_guests),
      number_of_adults: Number.parseInt(formData.number_of_adults),
      number_of_children: Number.parseInt(formData.number_of_children),
      special_requests: formData.special_requests || null,
      notes: formData.notes || null,
      status: "pending",
      salesperson_id: currentUserId,
    }

    const { error } = bookingId
      ? await supabase.from("room_bookings").update(bookingData).eq("id", bookingId)
      : await supabase.from("room_bookings").insert(bookingData)

    setLoading(false)

    if (error) {
      toast.error("Error al guardar la reservación")
      return
    }

    router.push("/reservaciones")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Reservación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, client_id: value })
                  if (formData.hotel_id) {
                    loadAgreements(formData.hotel_id, value)
                  }
                }}
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
                onValueChange={(value) => {
                  setFormData({ ...formData, hotel_id: value, room_id: "" })
                  loadRooms(value)
                  if (formData.client_id) {
                    loadAgreements(value, formData.client_id)
                  }
                }}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_id">Habitación *</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                disabled={!formData.hotel_id}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una habitación" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_number} - {room.category?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agreement_id">Convenio Corporativo</Label>
              <Select
                value={formData.agreement_id}
                onValueChange={(value) => setFormData({ ...formData, agreement_id: value })}
                disabled={!formData.hotel_id || !formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin convenio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin convenio</SelectItem>
                  {agreements.map((agreement) => (
                    <SelectItem key={agreement.id} value={agreement.id}>
                      {agreement.name} - {agreement.discount_percentage}% desc.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_date">Fecha de Entrada *</Label>
              <Input
                id="check_in_date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_out_date">Fecha de Salida *</Label>
              <Input
                id="check_out_date"
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Noches</Label>
              <Input value={calculateNights()} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number_of_guests">Total de Huéspedes *</Label>
              <Input
                id="number_of_guests"
                type="number"
                min="1"
                value={formData.number_of_guests}
                onChange={(e) => setFormData({ ...formData, number_of_guests: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_adults">Adultos *</Label>
              <Input
                id="number_of_adults"
                type="number"
                min="1"
                value={formData.number_of_adults}
                onChange={(e) => setFormData({ ...formData, number_of_adults: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_children">Niños</Label>
              <Input
                id="number_of_children"
                type="number"
                min="0"
                value={formData.number_of_children}
                onChange={(e) => setFormData({ ...formData, number_of_children: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requests">Solicitudes Especiales</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Ej: Cama king, piso alto, vista al mar..."
              rows={3}
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
              {loading ? "Guardando..." : bookingId ? "Actualizar" : "Crear"} Reservación
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
