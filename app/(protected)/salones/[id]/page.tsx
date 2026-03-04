import { createClient } from "@/lib/supabase/server"
import { EventSpaceForm } from "@/components/admin/event-spaces/event-space-form"
import { notFound } from "next/navigation"

export default async function EditEventSpacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: eventSpace }, { data: hotels }] = await Promise.all([
    supabase.from("event_spaces").select("*").eq("id", id).single(),
    supabase.from("hotels").select("id, code, name").eq("status", "activo").order("name", { ascending: true }),
  ])

  if (!eventSpace) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Salón de Eventos</h1>
        <p className="text-sm text-muted-foreground">Modifica la información del salón</p>
      </div>

      <EventSpaceForm eventSpace={eventSpace} hotels={hotels || []} />
    </div>
  )
}
