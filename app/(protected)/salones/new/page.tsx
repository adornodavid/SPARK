import { createClient } from "@/lib/supabase/server"
import { EventSpaceForm } from "@/components/admin/event-spaces/event-space-form"

export default async function NewEventSpacePage() {
  const supabase = await createClient()

  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, code, name")
    .eq("status", "activo")
    .order("name", { ascending: true })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Salón de Eventos</h1>
        <p className="text-sm text-muted-foreground">Registra un nuevo salón de eventos en el sistema</p>
      </div>

      <EventSpaceForm hotels={hotels || []} />
    </div>
  )
}
