"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ProspectsQuotationsBoard } from "@/components/admin/quotations/prospects-quotations-board"

export default function QuotationsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkSession() {
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

      setAuthorized(true)
    }

    checkSession()
  }, [router])

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones de Banquetes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona prospectos y cotizaciones de eventos
          </p>
        </div>
        <Link href="/cotizaciones/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      <ProspectsQuotationsBoard />
    </div>
  )
}
