import { createClient } from "@/lib/supabase/server"
import { RoomCategoryForm } from "@/components/admin/room-categories/room-category-form"

export default async function NewRoomCategoryPage() {
  const supabase = await createClient()

  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, code, name")
    .eq("status", "activo")
    .order("name", { ascending: true })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Categoría de Habitación</h1>
        <p className="text-sm text-muted-foreground">Define una nueva categoría o tipo de habitación</p>
      </div>

      <RoomCategoryForm hotels={hotels || []} />
    </div>
  )
}
