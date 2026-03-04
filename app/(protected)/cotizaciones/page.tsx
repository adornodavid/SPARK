"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { QuotationsTable } from "@/components/admin/quotations/quotations-table"
import { QuotationsFilter } from "@/components/admin/quotations/quotations-filter"

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    hotel_id: "",
    search: "",
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    async function checkSession() {
      const session = await obtenerSesion()

      // Validar sesión activa
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }

      // Validar roles permitidos (1,2,3,4)
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }

      loadQuotations()
    }

    checkSession()
  }, [router])

  useEffect(() => {
    if (!loading) {
      loadQuotations()
    }
  }, [filters])

  async function loadQuotations() {
    let query = supabase
      .from("vw_ocotizaciones")
      .select("*")
      .order("id", { ascending: false })

    if (filters.status) {
      query = query.eq("estatus", filters.status)
    }
    if (filters.hotel_id) {
      query = query.eq("hotelid", filters.hotel_id)
    }
    if (filters.search) {
      query = query.ilike("folio", `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading quotations:", error)
    } else {
      setQuotations(data || [])
    }
    setLoading(false)
  }

  if (loading) {
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
          <p className="text-muted-foreground mt-1">Gestiona las cotizaciones de eventos y banquetes</p>
        </div>
        <Link href="/cotizaciones/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      <QuotationsFilter filters={filters} onFiltersChange={setFilters} />
      <QuotationsTable quotations={quotations} loading={loading} onUpdate={loadQuotations} />
    </div>
  )
}
