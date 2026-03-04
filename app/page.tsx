import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role === "admin" || profile?.role === "superadmin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  } else {
    redirect("/auth/login")
  }
}
