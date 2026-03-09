"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface BookingsTableProps {
  bookings: any[]
  loading: boolean
  onUpdate: () => void
}

const statusConfig = {
  pending: { label: "Pendiente", variant: "secondary" as const },
  confirmed: { label: "Confirmada", variant: "default" as const },
  checked_in: { label: "Check-in", variant: "default" as const },
  checked_out: { label: "Check-out", variant: "default" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const },
  no_show: { label: "No Show", variant: "destructive" as const },
}

export function BookingsTable({ bookings, loading, onUpdate }: BookingsTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar esta reservación?")) return

    const { error } = await supabase.from("room_bookings").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar la reservación")
    } else {
      toast.success("Reservación eliminada correctamente")
      onUpdate()
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Habitación</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Noches</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                No hay reservaciones registradas
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => {
              const status = statusConfig[booking.status as keyof typeof statusConfig]
              const nights = booking.number_of_nights || 0

              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.folio}</TableCell>
                  <TableCell>{booking.client?.name}</TableCell>
                  <TableCell>{booking.hotel?.name}</TableCell>
                  <TableCell>
                    {booking.room?.room_number} ({booking.room?.category?.name})
                  </TableCell>
                  <TableCell>{new Date(booking.check_in_date).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>{new Date(booking.check_out_date).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>{nights}</TableCell>
                  <TableCell>${booking.total_amount?.toLocaleString() || "0"}</TableCell>
                  <TableCell>
                    <Badge variant={status?.variant || "secondary"}>{status?.label || booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/reservaciones/${booking.id}`}>
                        <Button variant="ghost" size="icon" title="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/reservaciones/${booking.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
