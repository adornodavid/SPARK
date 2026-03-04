"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const statusConfig = {
  pending: { label: "Pendiente", variant: "secondary" as const },
  confirmed: { label: "Confirmada", variant: "default" as const },
  checked_in: { label: "Check-in", variant: "default" as const },
  checked_out: { label: "Check-out", variant: "default" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const },
  no_show: { label: "No Show", variant: "destructive" as const },
}

export default function ReservacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    loadBooking()
  }, [resolvedParams.id])

  async function loadBooking() {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("room_bookings")
      .select("*,client:clients(*),hotel:hotels(*),room:rooms(*,category:room_categories(*))")
      .eq("id", resolvedParams.id)
      .single()

    if (error) {
      console.error("Error loading booking:", error)
      router.push("/reservaciones")
      return
    }

    setBooking(data)
    setLoading(false)
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!booking) {
    return <div>Reservación no encontrada</div>
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reservación #{booking.folio}</h1>
          <p className="text-sm text-muted-foreground">Detalles de la reservación</p>
        </div>
        <Button asChild>
          <Link href={`/reservaciones/${booking.id}/edit`}>Editar</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-medium">{booking.client?.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div>{booking.client?.email || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Teléfono</div>
              <div>{booking.client?.phone || "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Reservación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Hotel</div>
              <div className="font-medium">{booking.hotel?.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Habitación</div>
              <div>
                {booking.room?.room_number} - {booking.room?.category?.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <Badge variant={status?.variant}>{status?.label}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Check-in</div>
              <div className="font-medium">{new Date(booking.check_in_date).toLocaleDateString("es-MX")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-out</div>
              <div className="font-medium">{new Date(booking.check_out_date).toLocaleDateString("es-MX")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Número de noches</div>
              <div>{booking.number_of_nights}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Huéspedes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Total de huéspedes</div>
              <div className="font-medium">{booking.number_of_guests}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Adultos</div>
              <div>{booking.number_of_adults}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Niños</div>
              <div>{booking.number_of_children}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.special_requests && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Especiales</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{booking.special_requests}</p>
          </CardContent>
        </Card>
      )}

      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
