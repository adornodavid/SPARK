import { createClient } from "@/lib/supabase/server"
import { HotelForm } from "@/components/admin/hotels/hotel-form"
import { notFound } from "next/navigation"

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hotel } = await supabase.from("hotels").select("*").eq("id", id).single()

  if (!hotel) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Hotel</h1>
        <p className="text-sm text-muted-foreground">Modifica la información del hotel</p>
      </div>

      <HotelForm hotel={hotel} />
    </div>
  )
}
