import { HotelForm } from "@/components/admin/hotels/hotel-form"

export default function NewHotelPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Hotel</h1>
        <p className="text-sm text-muted-foreground">Registra un nuevo hotel en el sistema</p>
      </div>

      <HotelForm />
    </div>
  )
}
