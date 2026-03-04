import type React from "react"
import { redirect } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] AdminLayout - Iniciando...")
  const session = await obtenerSesion()
  console.log("[v0] AdminLayout - session obtenida:", JSON.stringify(session))

  // If no session or session not active, redirect to login
  if (!session) {
    console.log("[v0] AdminLayout - session es null, redirigiendo a login")
    redirect("/auth/login")
  }

  if (!session.SesionActiva) {
    console.log("[v0] AdminLayout - SesionActiva es false, redirigiendo a login")
    redirect("/auth/login")
  }

  // Check if user has admin role
  console.log("[v0] AdminLayout - Verificando rol:", session.Rol)
  if (!session.Rol) {
    console.log("[v0] AdminLayout - No hay rol, redirigiendo a dashboard")
    redirect("/dashboard")
  }

  console.log("[v0] AdminLayout - Todo OK, renderizando layout")
  return (
    <div className="flex min-h-svh w-full">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader user={session} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
