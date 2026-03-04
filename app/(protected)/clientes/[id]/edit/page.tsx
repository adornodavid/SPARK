import { createClient } from "@/lib/supabase/server"
import { ClientForm } from "@/components/admin/clients/client-form"
import { notFound, redirect } from "next/navigation"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: client }, { data: users }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("role", ["vendedor", "coordinador", "admin", "superadmin"])
      .order("first_name", { ascending: true }),
  ])

  if (!client) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Cliente</h1>
        <p className="text-sm text-muted-foreground">Modifica la información del cliente</p>
      </div>

      <ClientForm client={client} users={users || []} currentUserId={user.id} />
    </div>
  )
}
