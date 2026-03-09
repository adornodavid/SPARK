"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { EventSpaceForm } from "@/components/admin/event-spaces/event-space-form"
import type { ddlItem } from "@/types/common"
import { createClient } from "@/lib/supabase/client"

export default function EditEventSpacePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])
  const [eventSpace, setEventSpace] = useState<any>(null)

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

      const [hotelesResult] = await Promise.all([listaDesplegableHoteles()])
      if (hotelesResult.success && hotelesResult.data) {
        setHotelesList(hotelesResult.data)
      }

      const supabase = createClient()
      const { data } = await supabase.from("event_spaces").select("*").eq("id", id).single()
      if (!data) {
        router.push("/salones")
        return
      }
      setEventSpace(data)
      setLoading(false)
    }
    init()
  }, [router, id])

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
          <h1 className="text-2xl font-semibold tracking-tight">Editar Salón de Eventos</h1>
          <p className="text-sm text-muted-foreground">Modifica la información del salón</p>
        </div>

        <EventSpaceForm eventSpace={eventSpace} hotelesList={hotelesList} />
      </div>
    </div>
  )
}
