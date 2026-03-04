"use server"

import { createClient } from "@supabase/supabase-js"

export async function createAdminUser() {
  // Use service role key for admin operations
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: "arkamia.ti.ia@gmail.com",
      password: "Arkamia25",
      email_confirm: true,
      user_metadata: {
        full_name: "Arkamia",
        role: "admin_principal", // Using correct ENUM value
      },
    })

    if (userError) {
      console.error("[v0] Error creating user:", userError)

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find((u) => u.email === "arkamia.ti.ia@gmail.com")

      if (existingUser) {
        const { data: userRecord, error: userCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("id", existingUser.id)
          .single()

        if (!userRecord && !userCheckError) {
          const { error: directInsertError } = await supabase.from("users").insert({
            id: existingUser.id,
            email: existingUser.email || "arkamia.ti.ia@gmail.com",
            full_name: "Arkamia",
            role: "admin_principal",
            is_active: true,
          })

          if (directInsertError) {
            console.error("[v0] Error creating user record:", directInsertError)
            return { success: false, error: directInsertError.message }
          }
        }

        return {
          success: true,
          message: "Usuario administrador ya existe y se configuró correctamente",
          user: {
            email: existingUser.email,
            id: existingUser.id,
          },
        }
      }

      return { success: false, error: userError.message }
    }

    if (userData.user) {
      const { data: userRecord, error: userCheckError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", userData.user.id)
        .single()

      if (!userRecord || userCheckError) {
        const { error: insertError } = await supabase.from("users").insert({
          id: userData.user.id,
          email: userData.user.email || "arkamia.ti.ia@gmail.com",
          full_name: "Arkamia",
          role: "admin_principal",
          is_active: true,
        })

        if (insertError) {
          console.error("[v0] Error creating user record:", insertError)
          return { success: false, error: insertError.message }
        }
      } else if (userRecord.role !== "admin_principal") {
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: "admin_principal" })
          .eq("id", userData.user.id)

        if (updateError) {
          console.error("[v0] Error updating user role:", updateError)
          return { success: false, error: updateError.message }
        }
      }
    }

    return {
      success: true,
      message: "Usuario administrador creado exitosamente",
      user: {
        email: userData.user?.email,
        id: userData.user?.id,
      },
    }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: String(error) }
  }
}
