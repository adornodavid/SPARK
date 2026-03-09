"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Client360View } from "@/components/admin/crm/client-360"

function Client360PageContent() {
  const router = useRouter()
  const params = useParams()
  const clienteId = Number(params.id)

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const sessionData = await obtenerSesion()
      if (!sessionData || !sessionData.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(sessionData.RolId))) {
        router.push("/dashboard")
        return
      }
      setSession(sessionData)
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading || !clienteId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando perfil del cliente...</p>
        </div>
      </div>
    )
  }

  return <Client360View session={session} clienteId={clienteId} />
}

export default function Client360Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando perfil del cliente...</p>
          </div>
        </div>
      }
    >
      <Client360PageContent />
    </Suspense>
  )
}
