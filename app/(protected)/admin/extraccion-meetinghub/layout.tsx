import type React from "react"
import { redirect } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"

export default async function ExtraccionMeetinghubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await obtenerSesion()
  const rolId = Number(session?.RolId) || 0

  if (rolId !== 1) {
    redirect("/sin-permisos?ruta=/admin/extraccion-meetinghub")
  }

  return <>{children}</>
}
