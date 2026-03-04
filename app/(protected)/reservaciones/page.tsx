"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { BookingsTable } from "@/components/admin/bookings/bookings-table"
import { BookingsFilter } from "@/components/admin/bookings/bookings-filter"
import { createBrowserClient } from "@/lib/supabase/client"

export default function ReservacionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<any[]>([
    {
      id: 1,
      folio: "RES-001",
      check_in: "2024-03-15",
      check_out: "2024-03-18",
      status: "confirmada",
      total_amount: 4500,
      num_habitaciones: 2,
      client: { name: "María González López", email: "maria.gonzalez@example.com", telefono: "8112345678" },
      hotel: { name: "Holiday Inn Parque Fundidora", acronimo: "HIPF" },
      room: { number: "305", room_type: "Suite Junior" },
      created_at: "2024-01-20T10:30:00Z"
    },
    {
      id: 2,
      folio: "RES-002",
      check_in: "2024-04-10",
      check_out: "2024-04-12",
      status: "pendiente",
      total_amount: 3000,
      num_habitaciones: 1,
      client: { name: "Carlos Rodríguez Martínez", email: "carlos.rodriguez@example.com", telefono: "8187654321" },
      hotel: { name: "Holiday Inn Parque Fundidora", acronimo: "HIPF" },
      room: { number: "210", room_type: "Doble Estándar" },
      created_at: "2024-02-05T14:15:00Z"
    },
    {
      id: 3,
      folio: "RES-003",
      check_in: "2024-05-20",
      check_out: "2024-05-25",
      status: "confirmada",
      total_amount: 7500,
      num_habitaciones: 3,
      client: { name: "Ana Fernández Sánchez", email: "ana.fernandez@example.com", telefono: "8198765432" },
      hotel: { name: "Holiday Inn Parque Fundidora", acronimo: "HIPF" },
      room: { number: "401", room_type: "Suite Ejecutiva" },
      created_at: "2024-02-15T09:00:00Z"
    },
    {
      id: 4,
      folio: "RES-004",
      check_in: "2024-06-01",
      check_out: "2024-06-03",
      status: "cancelada",
      total_amount: 2400,
      num_habitaciones: 1,
      client: { name: "Luis Ramírez García", email: "luis.ramirez@example.com", telefono: "8156789012" },
      hotel: { name: "Holiday Inn Parque Fundidora", acronimo: "HIPF" },
      room: { number: "115", room_type: "Individual" },
      created_at: "2024-02-20T16:45:00Z"
    }
  ])
  const [filters, setFilters] = useState({
    status: "all",
    hotel_id: "all",
    date_from: "",
    date_to: "",
  })

  useEffect(() => {
    async function checkSession() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }
      setLoading(false)
      loadBookings()
    }
    checkSession()
  }, [router])

  async function loadBookings() {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("room_bookings")
      .select("*,client:clients(*),hotel:hotels(*),room:rooms(*)")
      .order("created_at", { ascending: false })
    if (data) setBookings(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las reservaciones de habitaciones</p>
        </div>
        <Button asChild>
          <Link href="/reservaciones/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reservación
          </Link>
        </Button>
      </div>
      <BookingsFilter filters={filters} onFiltersChange={setFilters} />
      <BookingsTable bookings={bookings} loading={loading} onUpdate={loadBookings} />
    </div>
  )
}
