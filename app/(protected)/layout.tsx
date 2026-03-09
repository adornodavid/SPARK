import type React from "react"
import { redirect } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { QuotationsProvider } from "@/contexts/quotations-context"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await obtenerSesion()

  // If no session or session not active, redirect to login
  if (!session || !session.SesionActiva) {
    redirect("/auth/login")
  }

  return (
    <QuotationsProvider>
      <div className="flex min-h-svh w-full">
        <AdminSidebar />
        <div className="ml-[100px] flex flex-1 flex-col">
          <AdminHeader user={session} />
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </QuotationsProvider>
  )
}
