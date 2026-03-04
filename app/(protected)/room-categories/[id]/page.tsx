import { createClient } from "@/lib/supabase/server"
import { RoomCategoryForm } from "@/components/admin/room-categories/room-category-form"
import { notFound } from "next/navigation"

export default async function EditRoomCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: category }, { data: hotels }] = await Promise.all([
    supabase.from("room_categories").select("*").eq("id", id).single(),
    supabase.from("hotels").select("id, code, name").eq("status", "activo").order("name", { ascending: true }),
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Categoría de Habitación</h1>
        <p className="text-sm text-muted-foreground">Modifica la información de la categoría</p>
      </div>

      <RoomCategoryForm category={category} hotels={hotels || []} />
    </div>
  )
}
