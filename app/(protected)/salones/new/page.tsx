"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { EventSpaceForm } from "@/components/admin/event-spaces/event-space-form"
import type { ddlItem } from "@/types/common"

export default function NewEventSpacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])

  useEffect(() => {
    async function init() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }

      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHotelesList(result.data)
      }

      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFAF5] p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo Salón de Eventos</h1>
          <p className="text-sm text-muted-foreground">Registra un nuevo salón de eventos en el sistema</p>
        </div>

        <EventSpaceForm hotelesList={hotelesList} />
      </div>
    </div>
  )
}
