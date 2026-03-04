"use client"

import { use } from "react"
import { BookingForm } from "@/components/admin/bookings/booking-form"

export default function EditReservacionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Reservación</h1>
        <p className="text-sm text-muted-foreground">Modifica los datos de la reservación</p>
      </div>
      <BookingForm bookingId={resolvedParams.id} />
    </div>
  )
}
