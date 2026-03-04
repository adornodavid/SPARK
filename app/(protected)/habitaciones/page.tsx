"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RoomsTable } from "@/components/admin/rooms/rooms-table"
import { createBrowserClient } from "@/lib/supabase/client"

export default function HabitacionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<any[]>([])

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
      loadRooms()
    }
    checkSession()
  }, [router])

  async function loadRooms() {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("rooms")
      .select("*,hotel:hotels(name,code),room_categories(name)")
      .order("hotel_id")
      .order("room_number")
    if (data) setRooms(data)
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
          <h1 className="text-2xl font-semibold tracking-tight">Habitaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las habitaciones de los hoteles</p>
        </div>
        <Button asChild>
          <Link href="/habitaciones/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Habitación
          </Link>
        </Button>
      </div>
      <RoomsTable rooms={rooms} />
    </div>
  )
}
