"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { ActivitiesPanel } from "@/components/admin/crm/activities-panel"

function ActividadesPageContent() {
  const router = useRouter()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando actividades...</p>
        </div>
      </div>
    )
  }

  return <ActivitiesPanel session={session} />
}

export default function ActividadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando actividades...</p>
          </div>
        </div>
      }
    >
      <ActividadesPageContent />
    </Suspense>
  )
}
