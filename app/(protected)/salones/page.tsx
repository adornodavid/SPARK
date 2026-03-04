import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EventSpacesTable } from "@/components/admin/event-spaces/event-spaces-table"

export default async function EventSpacesPage() {
  const supabase = await createClient()

  const { data: eventSpaces } = await supabase
    .from("vw_osalones")
    .select("*")
    .order("hotelid", { ascending: true })
    .order("nombre", { ascending: true })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salones de Eventos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los salones de eventos de todos los hoteles</p>
        </div>
        <Button asChild>
          <Link href="/salones/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Salón
          </Link>
        </Button>
      </div>

      <EventSpacesTable eventSpaces={eventSpaces || []} />
    </div>
  )
}
