import { createClient } from "@/lib/supabase/server"
import { ClientForm } from "@/components/admin/clients/client-form"
import { redirect } from "next/navigation"

export default async function NewClientPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("role", ["vendedor", "coordinador", "admin", "superadmin"])
    .order("first_name", { ascending: true })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Cliente</h1>
        <p className="text-sm text-muted-foreground">Registra un nuevo cliente en el sistema</p>
      </div>

      <ClientForm users={users || []} currentUserId={user.id} />
    </div>
  )
}
